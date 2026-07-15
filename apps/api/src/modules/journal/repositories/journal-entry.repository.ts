import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/common/database/prisma.service';
import { JournalEntryWithRelations } from '../types/journal-entry-with-relations';

const WITH_RELATIONS = {
  include: {
    tags: true,
    trade: {
      select: { id: true, symbol: true, side: true },
    },
  },
} as const;

export interface JournalEntryFilters {
  tradeId?: string;
  tagId?: string;
}

@Injectable()
export class JournalEntryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(
    userId: string,
    filters: JournalEntryFilters,
  ): Promise<JournalEntryWithRelations[]> {
    return this.prisma.journalEntry.findMany({
      where: {
        userId,
        ...(filters.tradeId ? { tradeId: filters.tradeId } : {}),
        ...(filters.tagId ? { tags: { some: { id: filters.tagId } } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      ...WITH_RELATIONS,
    });
  }

  async findById(id: string): Promise<JournalEntryWithRelations | null> {
    return this.prisma.journalEntry.findUnique({
      where: { id },
      ...WITH_RELATIONS,
    });
  }

  async create(
    data: { userId: string; content: string; tradeId?: string },
    tagIds: string[],
  ): Promise<JournalEntryWithRelations> {
    return this.prisma.journalEntry.create({
      data: {
        ...data,
        tags: tagIds.length > 0 ? { connect: tagIds.map((id) => ({ id })) } : undefined,
      },
      ...WITH_RELATIONS,
    });
  }

  async update(
    id: string,
    data: { content?: string; tradeId?: string | null },
    tagIds?: string[],
  ): Promise<JournalEntryWithRelations> {
    return this.prisma.journalEntry.update({
      where: { id },
      data: {
        ...data,
        ...(tagIds !== undefined ? { tags: { set: tagIds.map((tagId) => ({ id: tagId })) } } : {}),
      },
      ...WITH_RELATIONS,
    });
  }

  async delete(id: string): Promise<JournalEntryWithRelations> {
    return this.prisma.journalEntry.delete({ where: { id }, ...WITH_RELATIONS });
  }

  async addScreenshotUrl(id: string, url: string): Promise<JournalEntryWithRelations> {
    return this.prisma.journalEntry.update({
      where: { id },
      data: { screenshotUrls: { push: url } },
      ...WITH_RELATIONS,
    });
  }

  async setScreenshotUrls(id: string, urls: string[]): Promise<JournalEntryWithRelations> {
    return this.prisma.journalEntry.update({
      where: { id },
      data: { screenshotUrls: urls },
      ...WITH_RELATIONS,
    });
  }
}
