import { Injectable } from '@nestjs/common';
import { WatchlistItem } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class WatchlistItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string): Promise<WatchlistItem[]> {
    return this.prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string): Promise<WatchlistItem | null> {
    return this.prisma.watchlistItem.findUnique({ where: { id } });
  }

  async findByCoinId(userId: string, coinId: string): Promise<WatchlistItem | null> {
    return this.prisma.watchlistItem.findUnique({
      where: { userId_coinId: { userId, coinId } },
    });
  }

  async create(data: {
    userId: string;
    coinId: string;
    symbol: string;
    name: string;
  }): Promise<WatchlistItem> {
    return this.prisma.watchlistItem.create({ data });
  }

  async delete(id: string): Promise<WatchlistItem> {
    return this.prisma.watchlistItem.delete({ where: { id } });
  }
}
