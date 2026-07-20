import { Injectable } from '@nestjs/common';
import { Prisma, Strategy } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class StrategyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string): Promise<Strategy[]> {
    return this.prisma.strategy.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Strategy | null> {
    return this.prisma.strategy.findUnique({ where: { id } });
  }

  async findByName(userId: string, name: string): Promise<Strategy | null> {
    return this.prisma.strategy.findUnique({ where: { userId_name: { userId, name } } });
  }

  async create(data: Prisma.StrategyUncheckedCreateInput): Promise<Strategy> {
    return this.prisma.strategy.create({ data });
  }

  async update(id: string, data: Prisma.StrategyUncheckedUpdateInput): Promise<Strategy> {
    return this.prisma.strategy.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Strategy> {
    return this.prisma.strategy.delete({ where: { id } });
  }
}
