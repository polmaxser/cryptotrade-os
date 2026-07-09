import { Injectable } from '@nestjs/common';
import { Prisma } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class TradeRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll(): Promise<any[]> {
    return this.prisma.trade.findMany({
      orderBy: {
        openedAt: 'desc',
      },
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.trade.findUnique({
      where: {
        id,
      },
    });
  }

  async create(
    data: Prisma.TradeUncheckedCreateInput,
  ): Promise<any> {
    return this.prisma.trade.create({
      data,
    });
  }

  async delete(id: string): Promise<any> {
    return this.prisma.trade.delete({
      where: {
        id,
      },
    });
  }
}