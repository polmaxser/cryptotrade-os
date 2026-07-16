import { Injectable } from '@nestjs/common';
import { NftHolding, Prisma } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class NftHoldingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string, portfolioId?: string): Promise<NftHolding[]> {
    return this.prisma.nftHolding.findMany({
      where: { userId, ...(portfolioId ? { portfolioId } : {}) },
      orderBy: { acquiredAt: 'desc' },
    });
  }

  async findById(id: string): Promise<NftHolding | null> {
    return this.prisma.nftHolding.findUnique({ where: { id } });
  }

  async create(data: Prisma.NftHoldingUncheckedCreateInput): Promise<NftHolding> {
    return this.prisma.nftHolding.create({ data });
  }

  async update(id: string, data: Prisma.NftHoldingUncheckedUpdateInput): Promise<NftHolding> {
    return this.prisma.nftHolding.update({ where: { id }, data });
  }

  async delete(id: string): Promise<NftHolding> {
    return this.prisma.nftHolding.delete({ where: { id } });
  }
}
