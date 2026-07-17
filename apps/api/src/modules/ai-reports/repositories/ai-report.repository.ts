import { Injectable } from '@nestjs/common';
import { AiReport, AiReportType, Prisma } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class AiReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string, type?: AiReportType): Promise<AiReport[]> {
    return this.prisma.aiReport.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      orderBy: { periodStart: 'desc' },
    });
  }

  async findById(id: string): Promise<AiReport | null> {
    return this.prisma.aiReport.findUnique({ where: { id } });
  }

  /** Idempotency check — a cron re-run or a manual trigger for an already-covered period shouldn't duplicate. */
  async findByUserTypeAndPeriodStart(
    userId: string,
    type: AiReportType,
    periodStart: Date,
  ): Promise<AiReport | null> {
    return this.prisma.aiReport.findUnique({
      where: { userId_type_periodStart: { userId, type, periodStart } },
    });
  }

  async create(data: Prisma.AiReportUncheckedCreateInput): Promise<AiReport> {
    return this.prisma.aiReport.create({ data });
  }
}
