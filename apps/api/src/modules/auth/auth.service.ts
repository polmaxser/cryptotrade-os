import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { createHash, randomBytes } from 'node:crypto';

import { UsersService } from '@/modules/users/users.service';
import { PublicUser, toPublicUser } from '@/modules/users/types/public-user';
import { PortfolioRepository } from '@/modules/portfolios/repositories/portfolio.repository';
import { BillingService } from '@/modules/billing/billing.service';
import { PrismaService } from '@/common/database/prisma.service';

import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AccessTokenPayload, TwoFactorChallengePayload } from './types/jwt-payload';

const DEFAULT_PORTFOLIO_NAME = 'Default Portfolio';
const TWO_FACTOR_CHALLENGE_TTL = '5m';
const TWO_FACTOR_ISSUER = 'CryptoTrade OS';

export interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface AuthResult {
  user: PublicUser;
  tokens: TokenPair;
}

export interface TwoFactorChallenge {
  requiresTwoFactor: true;
  challengeToken: string;
}

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

const REFRESH_TOKEN_BYTES = 64;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly portfolioRepository: PortfolioRepository,
    private readonly billingService: BillingService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto, meta: RequestMeta): Promise<AuthResult> {
    const existing = await this.usersService.findAuthUserByEmail(dto.email);

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await this.usersService.createUser(
        {
          email: dto.email,
          passwordHash,
          name: dto.name,
        },
        tx,
      );

      await this.portfolioRepository.create(
        {
          userId: createdUser.id,
          name: DEFAULT_PORTFOLIO_NAME,
          isDefault: true,
        },
        tx,
      );

      await this.billingService.createFreeSubscription(createdUser.id, tx);

      return createdUser;
    });

    const tokens = await this.issueTokenPair(user.id, meta);

    return { user: toPublicUser(user), tokens };
  }

  async login(dto: LoginDto, meta: RequestMeta): Promise<AuthResult | TwoFactorChallenge> {
    const user = await this.usersService.findAuthUserByEmail(dto.email);

    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    if (user.twoFactorEnabled) {
      const challengePayload: TwoFactorChallengePayload = {
        sub: user.id,
        purpose: '2fa_challenge',
      };

      const challengeToken = await this.jwtService.signAsync(challengePayload, {
        expiresIn: TWO_FACTOR_CHALLENGE_TTL,
      });

      return { requiresTwoFactor: true, challengeToken };
    }

    const tokens = await this.issueTokenPair(user.id, meta);

    return { user: toPublicUser(user), tokens };
  }

  async verifyTwoFactor(
    challengeToken: string,
    code: string,
    meta: RequestMeta,
  ): Promise<AuthResult> {
    let payload: TwoFactorChallengePayload;

    try {
      payload = await this.jwtService.verifyAsync<TwoFactorChallengePayload>(challengeToken);
    } catch {
      throw new UnauthorizedException('Challenge expired, please log in again');
    }

    if (payload.purpose !== '2fa_challenge') {
      throw new UnauthorizedException('Challenge expired, please log in again');
    }

    const user = await this.usersService.findAuthUserById(payload.sub);

    if (!user || !user.isActive || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('Challenge expired, please log in again');
    }

    if (!authenticator.verify({ token: code, secret: user.twoFactorSecret })) {
      throw new UnauthorizedException('Invalid verification code');
    }

    const tokens = await this.issueTokenPair(user.id, meta);

    return { user: toPublicUser(user), tokens };
  }

  async setupTwoFactor(userId: string): Promise<TwoFactorSetup> {
    const user = await this.usersService.findAuthUserById(userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    const secret = authenticator.generateSecret();

    await this.usersService.updateAuthFields(userId, { twoFactorSecret: secret });

    const otpauthUrl = authenticator.keyuri(user.email, TWO_FACTOR_ISSUER, secret);
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    return { secret, otpauthUrl, qrCodeDataUrl };
  }

  async enableTwoFactor(userId: string, code: string): Promise<void> {
    const user = await this.usersService.findAuthUserById(userId);

    if (!user?.twoFactorSecret) {
      throw new BadRequestException('Run 2FA setup before enabling it');
    }

    if (!authenticator.verify({ token: code, secret: user.twoFactorSecret })) {
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.usersService.updateAuthFields(userId, { twoFactorEnabled: true });
  }

  async disableTwoFactor(userId: string, code: string): Promise<void> {
    const user = await this.usersService.findAuthUserById(userId);

    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    if (!authenticator.verify({ token: code, secret: user.twoFactorSecret })) {
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.usersService.updateAuthFields(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });
  }

  async refresh(rawRefreshToken: string, meta: RequestMeta): Promise<AuthResult> {
    const stored = await this.refreshTokenRepository.findByTokenHash(
      this.hashToken(rawRefreshToken),
    );

    if (!stored) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    if (stored.revokedAt) {
      // Reuse of an already-rotated token signals a stolen token — kill the whole session family.
      await this.refreshTokenRepository.revokeAllForUser(stored.userId);
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const user = await this.usersService.findAuthUserById(stored.userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const accessTokenPayload: AccessTokenPayload = { sub: user.id, purpose: 'access' };
    const accessToken = await this.jwtService.signAsync(accessTokenPayload);
    const rawNewRefreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const refreshTokenExpiresAt = this.computeRefreshExpiry();

    await this.refreshTokenRepository.rotate(stored.id, {
      tokenHash: this.hashToken(rawNewRefreshToken),
      userId: user.id,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: refreshTokenExpiresAt,
    });

    return {
      user: toPublicUser(user),
      tokens: {
        accessToken,
        refreshToken: rawNewRefreshToken,
        refreshTokenExpiresAt,
      },
    };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const stored = await this.refreshTokenRepository.findByTokenHash(
      this.hashToken(rawRefreshToken),
    );

    if (stored && !stored.revokedAt) {
      await this.refreshTokenRepository.revoke(stored.id);
    }
  }

  private async issueTokenPair(userId: string, meta: RequestMeta): Promise<TokenPair> {
    const accessTokenPayload: AccessTokenPayload = { sub: userId, purpose: 'access' };
    const accessToken = await this.jwtService.signAsync(accessTokenPayload);

    const rawRefreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const refreshTokenExpiresAt = this.computeRefreshExpiry();

    await this.refreshTokenRepository.create({
      tokenHash: this.hashToken(rawRefreshToken),
      userId,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: refreshTokenExpiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      refreshTokenExpiresAt,
    };
  }

  private computeRefreshExpiry(): Date {
    const ttlDays = this.configService.get<number>('auth.refreshTokenTtlDays', 30);

    return new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
