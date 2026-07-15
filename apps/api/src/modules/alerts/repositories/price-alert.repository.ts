import { Injectable } from '@nestjs/common';
import { AlertDirection, AlertStatus, PriceAlert } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class PriceAlertRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string): Promise<PriceAlert[]> {
    return this.prisma.priceAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<PriceAlert | null> {
    return this.prisma.priceAlert.findUnique({ where: { id } });
  }

  async findActive(): Promise<PriceAlert[]> {
    return this.prisma.priceAlert.findMany({ where: { status: AlertStatus.ACTIVE } });
  }

  async create(data: {
    userId: string;
    coinId: string;
    symbol: string;
    direction: AlertDirection;
    targetPrice: number;
  }): Promise<PriceAlert> {
    return this.prisma.priceAlert.create({ data });
  }

  async markTriggered(id: string): Promise<PriceAlert> {
    return this.prisma.priceAlert.update({
      where: { id },
      data: { status: AlertStatus.TRIGGERED, triggeredAt: new Date() },
    });
  }

  async delete(id: string): Promise<PriceAlert> {
    return this.prisma.priceAlert.delete({ where: { id } });
  }
}
