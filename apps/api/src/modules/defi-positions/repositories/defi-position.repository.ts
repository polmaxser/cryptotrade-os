import { Injectable } from '@nestjs/common';
import { DeFiPosition, Prisma } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class DeFiPositionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string, portfolioId?: string): Promise<DeFiPosition[]> {
    return this.prisma.deFiPosition.findMany({
      where: { userId, ...(portfolioId ? { portfolioId } : {}) },
      orderBy: { openedAt: 'desc' },
    });
  }

  async findById(id: string): Promise<DeFiPosition | null> {
    return this.prisma.deFiPosition.findUnique({ where: { id } });
  }

  async create(data: Prisma.DeFiPositionUncheckedCreateInput): Promise<DeFiPosition> {
    return this.prisma.deFiPosition.create({ data });
  }

  async update(id: string, data: Prisma.DeFiPositionUncheckedUpdateInput): Promise<DeFiPosition> {
    return this.prisma.deFiPosition.update({ where: { id }, data });
  }

  async delete(id: string): Promise<DeFiPosition> {
    return this.prisma.deFiPosition.delete({ where: { id } });
  }
}
