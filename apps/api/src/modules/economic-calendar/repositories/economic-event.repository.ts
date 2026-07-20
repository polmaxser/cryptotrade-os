import { Injectable } from '@nestjs/common';
import { EconomicEvent, EconomicEventCategory, Prisma } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class EconomicEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findInRange(
    from: Date,
    to: Date,
    category?: EconomicEventCategory,
  ): Promise<EconomicEvent[]> {
    const where: Prisma.EconomicEventWhereInput = {
      eventDate: { gte: from, lte: to },
      ...(category ? { category } : {}),
    };

    return this.prisma.economicEvent.findMany({
      where,
      orderBy: { eventDate: 'asc' },
    });
  }

  async upsertByCategoryAndDate(
    data: Prisma.EconomicEventUncheckedCreateInput,
  ): Promise<EconomicEvent> {
    return this.prisma.economicEvent.upsert({
      where: {
        category_eventDate: {
          category: data.category,
          eventDate: data.eventDate as Date,
        },
      },
      create: data,
      update: data,
    });
  }
}
