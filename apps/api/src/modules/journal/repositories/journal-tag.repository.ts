import { Injectable } from '@nestjs/common';
import { JournalTag, JournalTagCategory, Prisma } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class JournalTagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string, category?: JournalTagCategory): Promise<JournalTag[]> {
    return this.prisma.journalTag.findMany({
      where: {
        userId,
        ...(category ? { category } : {}),
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findById(id: string): Promise<JournalTag | null> {
    return this.prisma.journalTag.findUnique({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<JournalTag[]> {
    return this.prisma.journalTag.findMany({ where: { id: { in: ids } } });
  }

  async findByName(
    userId: string,
    category: JournalTagCategory,
    name: string,
  ): Promise<JournalTag | null> {
    return this.prisma.journalTag.findUnique({
      where: {
        userId_category_name: { userId, category, name },
      },
    });
  }

  async create(data: Prisma.JournalTagUncheckedCreateInput): Promise<JournalTag> {
    return this.prisma.journalTag.create({ data });
  }

  async delete(id: string): Promise<JournalTag> {
    return this.prisma.journalTag.delete({ where: { id } });
  }
}
