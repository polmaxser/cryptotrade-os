import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import { RefreshToken, User } from '@cryptotrade/database';

import { AuthService } from './auth.service';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { UsersService } from '@/modules/users/users.service';
import { PortfolioRepository } from '@/modules/portfolios/repositories/portfolio.repository';
import { BillingService } from '@/modules/billing/billing.service';
import { PrismaService } from '@/common/database/prisma.service';

const JWT_SECRET = 'test-jwt-secret-for-auth-service-spec';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'trader@example.com',
    passwordHash: '',
    name: 'Trader',
    avatarUrl: null,
    isActive: true,
    emailVerifiedAt: null,
    isAdmin: false,
    twoFactorSecret: null,
    twoFactorEnabled: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function buildRefreshToken(overrides: Partial<RefreshToken> = {}): RefreshToken {
  return {
    id: 'rt-1',
    tokenHash: 'hash',
    userId: 'user-1',
    userAgent: null,
    ipAddress: null,
    revokedAt: null,
    replacedByTokenHash: null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function buildService() {
  const usersService = {
    findAuthUserByEmail: jest.fn(),
    findAuthUserById: jest.fn(),
    createUser: jest.fn(),
    updateAuthFields: jest.fn(),
  } as unknown as jest.Mocked<UsersService>;

  const refreshTokenRepository = {
    create: jest.fn(),
    findByTokenHash: jest.fn(),
    revoke: jest.fn(),
    rotate: jest.fn(),
    revokeAllForUser: jest.fn(),
  } as unknown as jest.Mocked<RefreshTokenRepository>;

  const portfolioRepository = {
    create: jest.fn(),
  } as unknown as jest.Mocked<PortfolioRepository>;

  const billingService = {
    createFreeSubscription: jest.fn(),
  } as unknown as jest.Mocked<BillingService>;

  const jwtService = new JwtService({ secret: JWT_SECRET });

  const configService = { get: jest.fn().mockReturnValue(30) } as never;

  const prisma = {
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  } as unknown as jest.Mocked<PrismaService>;

  const service = new AuthService(
    usersService,
    refreshTokenRepository,
    portfolioRepository,
    billingService,
    jwtService,
    configService,
    prisma,
  );

  return {
    service,
    usersService,
    refreshTokenRepository,
    portfolioRepository,
    billingService,
    jwtService,
  };
}

describe('AuthService.register', () => {
  it('rejects a duplicate email', async () => {
    const { service, usersService } = buildService();
    usersService.findAuthUserByEmail.mockResolvedValue(buildUser());

    await expect(
      service.register({ email: 'trader@example.com', password: 'Passw0rd!', name: 'T' }, {}),
    ).rejects.toThrow(ConflictException);
  });

  it('creates a user, default portfolio, and free subscription, returning tokens', async () => {
    const { service, usersService, portfolioRepository, billingService, refreshTokenRepository } =
      buildService();
    usersService.findAuthUserByEmail.mockResolvedValue(null);
    usersService.createUser.mockResolvedValue(buildUser({ passwordHash: 'irrelevant-hash' }));

    const result = await service.register(
      { email: 'trader@example.com', password: 'Passw0rd!', name: 'Trader' },
      { ipAddress: '127.0.0.1' },
    );

    expect(portfolioRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', isDefault: true }),
      expect.anything(),
    );
    expect(billingService.createFreeSubscription).toHaveBeenCalledWith('user-1', expect.anything());
    expect(refreshTokenRepository.create).toHaveBeenCalled();
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.tokens.accessToken).toEqual(expect.any(String));
    expect(result.tokens.refreshToken).toEqual(expect.any(String));
  });
});

describe('AuthService.login', () => {
  it('rejects an unknown email', async () => {
    const { service, usersService } = buildService();
    usersService.findAuthUserByEmail.mockResolvedValue(null);

    await expect(service.login({ email: 'nobody@example.com', password: 'x' }, {})).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an incorrect password', async () => {
    const { service, usersService } = buildService();
    const passwordHash = await argon2.hash('correct-password');
    usersService.findAuthUserByEmail.mockResolvedValue(buildUser({ passwordHash }));

    await expect(
      service.login({ email: 'trader@example.com', password: 'wrong-password' }, {}),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a deactivated account even with the correct password', async () => {
    const { service, usersService } = buildService();
    const passwordHash = await argon2.hash('correct-password');
    usersService.findAuthUserByEmail.mockResolvedValue(
      buildUser({ passwordHash, isActive: false }),
    );

    await expect(
      service.login({ email: 'trader@example.com', password: 'correct-password' }, {}),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('returns tokens directly when 2FA is disabled', async () => {
    const { service, usersService } = buildService();
    const passwordHash = await argon2.hash('correct-password');
    usersService.findAuthUserByEmail.mockResolvedValue(buildUser({ passwordHash }));

    const result = await service.login(
      { email: 'trader@example.com', password: 'correct-password' },
      {},
    );

    expect('requiresTwoFactor' in result).toBe(false);
    if (!('requiresTwoFactor' in result)) {
      expect(result.tokens.accessToken).toEqual(expect.any(String));
    }
  });

  it('returns a 2FA challenge instead of tokens when 2FA is enabled, without issuing a refresh token', async () => {
    const { service, usersService, refreshTokenRepository } = buildService();
    const passwordHash = await argon2.hash('correct-password');
    usersService.findAuthUserByEmail.mockResolvedValue(
      buildUser({ passwordHash, twoFactorEnabled: true, twoFactorSecret: 'SECRETBASE32' }),
    );

    const result = await service.login(
      { email: 'trader@example.com', password: 'correct-password' },
      {},
    );

    expect(result).toEqual({
      requiresTwoFactor: true,
      challengeToken: expect.any(String),
    });
    expect(refreshTokenRepository.create).not.toHaveBeenCalled();
  });
});

describe('AuthService.verifyTwoFactor', () => {
  async function makeChallengeToken(jwtService: JwtService, userId: string): Promise<string> {
    return jwtService.signAsync({ sub: userId, purpose: '2fa_challenge' }, { expiresIn: '5m' });
  }

  it('rejects a garbage/expired challenge token', async () => {
    const { service } = buildService();

    await expect(service.verifyTwoFactor('not-a-real-jwt', '123456', {})).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an access token presented as a 2FA challenge token', async () => {
    const { service, jwtService } = buildService();
    const accessToken = await jwtService.signAsync({ sub: 'user-1', purpose: 'access' });

    await expect(service.verifyTwoFactor(accessToken, '123456', {})).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects when the user no longer has 2FA enabled', async () => {
    const { service, jwtService, usersService } = buildService();
    const challengeToken = await makeChallengeToken(jwtService, 'user-1');
    usersService.findAuthUserById.mockResolvedValue(buildUser({ twoFactorEnabled: false }));

    await expect(service.verifyTwoFactor(challengeToken, '123456', {})).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an incorrect TOTP code', async () => {
    const { service, jwtService, usersService } = buildService();
    const secret = authenticator.generateSecret();
    const challengeToken = await makeChallengeToken(jwtService, 'user-1');
    usersService.findAuthUserById.mockResolvedValue(
      buildUser({ twoFactorEnabled: true, twoFactorSecret: secret }),
    );

    const validCode = authenticator.generate(secret);
    const wrongCode = validCode === '000000' ? '111111' : '000000';

    await expect(service.verifyTwoFactor(challengeToken, wrongCode, {})).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('succeeds with a valid TOTP code and issues tokens', async () => {
    const { service, jwtService, usersService } = buildService();
    const secret = authenticator.generateSecret();
    const challengeToken = await makeChallengeToken(jwtService, 'user-1');
    usersService.findAuthUserById.mockResolvedValue(
      buildUser({ twoFactorEnabled: true, twoFactorSecret: secret }),
    );

    const validCode = authenticator.generate(secret);
    const result = await service.verifyTwoFactor(challengeToken, validCode, {});

    expect(result.tokens.accessToken).toEqual(expect.any(String));
  });
});

describe('AuthService — 2FA enable/disable', () => {
  it('enableTwoFactor requires setup to have run first', async () => {
    const { service, usersService } = buildService();
    usersService.findAuthUserById.mockResolvedValue(buildUser({ twoFactorSecret: null }));

    await expect(service.enableTwoFactor('user-1', '123456')).rejects.toThrow(BadRequestException);
  });

  it('enableTwoFactor rejects an incorrect code', async () => {
    const { service, usersService } = buildService();
    const secret = authenticator.generateSecret();
    usersService.findAuthUserById.mockResolvedValue(buildUser({ twoFactorSecret: secret }));

    const wrongCode = authenticator.generate(secret) === '000000' ? '111111' : '000000';

    await expect(service.enableTwoFactor('user-1', wrongCode)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('enableTwoFactor turns 2FA on with a correct code', async () => {
    const { service, usersService } = buildService();
    const secret = authenticator.generateSecret();
    usersService.findAuthUserById.mockResolvedValue(buildUser({ twoFactorSecret: secret }));

    await service.enableTwoFactor('user-1', authenticator.generate(secret));

    expect(usersService.updateAuthFields).toHaveBeenCalledWith('user-1', {
      twoFactorEnabled: true,
    });
  });

  it('disableTwoFactor requires 2FA to already be enabled', async () => {
    const { service, usersService } = buildService();
    usersService.findAuthUserById.mockResolvedValue(buildUser({ twoFactorEnabled: false }));

    await expect(service.disableTwoFactor('user-1', '123456')).rejects.toThrow(BadRequestException);
  });

  it('disableTwoFactor clears the secret with a correct code', async () => {
    const { service, usersService } = buildService();
    const secret = authenticator.generateSecret();
    usersService.findAuthUserById.mockResolvedValue(
      buildUser({ twoFactorEnabled: true, twoFactorSecret: secret }),
    );

    await service.disableTwoFactor('user-1', authenticator.generate(secret));

    expect(usersService.updateAuthFields).toHaveBeenCalledWith('user-1', {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });
  });
});

describe('AuthService.refresh — rotation and reuse detection', () => {
  it('rejects an unknown token', async () => {
    const { service, refreshTokenRepository } = buildService();
    refreshTokenRepository.findByTokenHash.mockResolvedValue(null);

    await expect(service.refresh('unknown-raw-token', {})).rejects.toThrow(UnauthorizedException);
  });

  it('revokes every token for the user when a reused (already-rotated) token is presented', async () => {
    const { service, refreshTokenRepository } = buildService();
    refreshTokenRepository.findByTokenHash.mockResolvedValue(
      buildRefreshToken({ revokedAt: new Date('2026-01-01') }),
    );

    await expect(service.refresh('stolen-raw-token', {})).rejects.toThrow(UnauthorizedException);
    expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith('user-1');
  });

  it('rejects an expired but not-yet-revoked token', async () => {
    const { service, refreshTokenRepository } = buildService();
    refreshTokenRepository.findByTokenHash.mockResolvedValue(
      buildRefreshToken({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(service.refresh('expired-raw-token', {})).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a token belonging to a deactivated user', async () => {
    const { service, refreshTokenRepository, usersService } = buildService();
    refreshTokenRepository.findByTokenHash.mockResolvedValue(buildRefreshToken());
    usersService.findAuthUserById.mockResolvedValue(buildUser({ isActive: false }));

    await expect(service.refresh('raw-token', {})).rejects.toThrow(UnauthorizedException);
  });

  it('rotates a valid token and returns a fresh token pair', async () => {
    const { service, refreshTokenRepository, usersService } = buildService();
    const stored = buildRefreshToken();
    refreshTokenRepository.findByTokenHash.mockResolvedValue(stored);
    usersService.findAuthUserById.mockResolvedValue(buildUser());

    const result = await service.refresh('raw-token', { ipAddress: '1.2.3.4' });

    expect(refreshTokenRepository.rotate).toHaveBeenCalledWith(
      stored.id,
      expect.objectContaining({ userId: 'user-1', ipAddress: '1.2.3.4' }),
    );
    expect(result.tokens.accessToken).toEqual(expect.any(String));
    expect(result.tokens.refreshToken).toEqual(expect.any(String));
  });
});

describe('AuthService.logout', () => {
  it('revokes a valid, active token', async () => {
    const { service, refreshTokenRepository } = buildService();
    const stored = buildRefreshToken();
    refreshTokenRepository.findByTokenHash.mockResolvedValue(stored);

    await service.logout('raw-token');

    expect(refreshTokenRepository.revoke).toHaveBeenCalledWith(stored.id);
  });

  it('does nothing for an unknown token', async () => {
    const { service, refreshTokenRepository } = buildService();
    refreshTokenRepository.findByTokenHash.mockResolvedValue(null);

    await expect(service.logout('unknown-token')).resolves.toBeUndefined();
    expect(refreshTokenRepository.revoke).not.toHaveBeenCalled();
  });

  it('does nothing for an already-revoked token', async () => {
    const { service, refreshTokenRepository } = buildService();
    refreshTokenRepository.findByTokenHash.mockResolvedValue(
      buildRefreshToken({ revokedAt: new Date() }),
    );

    await service.logout('already-revoked-token');

    expect(refreshTokenRepository.revoke).not.toHaveBeenCalled();
  });
});
