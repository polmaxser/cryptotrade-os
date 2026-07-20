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

  async findById(id: string): Promise<EconomicEvent | null> {
    return this.prisma.economicEvent.findUnique({ where: { id } });
  }

  async create(data: Prisma.EconomicEventUncheckedCreateInput): Promise<EconomicEvent> {
    return this.prisma.economicEvent.create({ data });
  }

  async update(id: string, data: Prisma.EconomicEventUncheckedUpdateInput): Promise<EconomicEvent> {
    return this.prisma.economicEvent.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.economicEvent.delete({ where: { id } });
  }
}
