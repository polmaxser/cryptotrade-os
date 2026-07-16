import { Injectable } from '@nestjs/common';
import {
  CoachInsight,
  CoachInsightPattern,
  CoachInsightStatus,
  Prisma,
} from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class CoachInsightRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string, status?: CoachInsightStatus): Promise<CoachInsight[]> {
    return this.prisma.coachInsight.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<CoachInsight | null> {
    return this.prisma.coachInsight.findUnique({ where: { id } });
  }

  /** Most recent insight of this pattern for the user — used to decide whether re-detection should skip it. */
  async findMostRecentByUserAndPattern(
    userId: string,
    pattern: CoachInsightPattern,
  ): Promise<CoachInsight | null> {
    return this.prisma.coachInsight.findFirst({
      where: { userId, pattern },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.CoachInsightUncheckedCreateInput): Promise<CoachInsight> {
    return this.prisma.coachInsight.create({ data });
  }

  async updateStatus(id: string, status: CoachInsightStatus): Promise<CoachInsight> {
    return this.prisma.coachInsight.update({
      where: { id },
      data: { status, reviewedAt: new Date() },
    });
  }
}
