import { Injectable } from '@nestjs/common';
import { BacktestRun, Prisma } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class BacktestRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string): Promise<BacktestRun[]> {
    return this.prisma.backtestRun.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<BacktestRun | null> {
    return this.prisma.backtestRun.findUnique({ where: { id } });
  }

  async create(data: Prisma.BacktestRunUncheckedCreateInput): Promise<BacktestRun> {
    return this.prisma.backtestRun.create({ data });
  }
}
