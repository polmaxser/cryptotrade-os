import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';

import { UsersService } from '@/modules/users/users.service';
import { PublicUser, toPublicUser } from '@/modules/users/types/public-user';
import { PortfolioRepository } from '@/modules/portfolios/repositories/portfolio.repository';
import { PrismaService } from '@/common/database/prisma.service';

import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const DEFAULT_PORTFOLIO_NAME = 'Default Portfolio';

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

const REFRESH_TOKEN_BYTES = 64;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly portfolioRepository: PortfolioRepository,
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

      return createdUser;
    });

    const tokens = await this.issueTokenPair(user.id, meta);

    return { user: toPublicUser(user), tokens };
  }

  async login(dto: LoginDto, meta: RequestMeta): Promise<AuthResult> {
    const user = await this.usersService.findAuthUserByEmail(dto.email);

    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    const tokens = await this.issueTokenPair(user.id, meta);

    return { user: toPublicUser(user), tokens };
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

    const accessToken = await this.jwtService.signAsync({ sub: user.id });
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
    const accessToken = await this.jwtService.signAsync({ sub: userId });

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
