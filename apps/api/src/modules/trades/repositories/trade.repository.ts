import { Injectable } from '@nestjs/common';
import { Prisma, Trade } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class TradeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string): Promise<Trade[]> {
    return this.prisma.trade.findMany({
      where: {
        userId,
      },
      orderBy: {
        openedAt: 'desc',
      },
    });
  }

  async findById(id: string): Promise<Trade | null> {
    return this.prisma.trade.findUnique({
      where: {
        id,
      },
    });
  }

  async create(data: Prisma.TradeUncheckedCreateInput): Promise<Trade> {
    return this.prisma.trade.create({
      data,
    });
  }

  async update(id: string, data: Prisma.TradeUncheckedUpdateInput): Promise<Trade> {
    return this.prisma.trade.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(id: string): Promise<Trade> {
    return this.prisma.trade.delete({
      where: {
        id,
      },
    });
  }
}
