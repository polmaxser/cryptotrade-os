import { Injectable } from '@nestjs/common';
import { Prisma, RefreshToken } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.RefreshTokenUncheckedCreateInput): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data,
    });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({
      where: {
        tokenHash,
      },
    });
  }

  async revoke(id: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({
      where: {
        id,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Atomically revokes the old token and creates its replacement, so a
   * concurrent refresh can never leave two live tokens for one rotation.
   */
  async rotate(
    oldId: string,
    newTokenData: Prisma.RefreshTokenUncheckedCreateInput,
  ): Promise<RefreshToken> {
    const [, created] = await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: {
          id: oldId,
        },
        data: {
          revokedAt: new Date(),
          replacedByTokenHash: newTokenData.tokenHash,
        },
      }),
      this.prisma.refreshToken.create({
        data: newTokenData,
      }),
    ]);

    return created;
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
