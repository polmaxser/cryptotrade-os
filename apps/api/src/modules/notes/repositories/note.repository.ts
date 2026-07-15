import { Injectable } from '@nestjs/common';
import { Note } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class NoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string): Promise<Note[]> {
    return this.prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Note | null> {
    return this.prisma.note.findUnique({ where: { id } });
  }

  async create(data: { userId: string; title: string; content: string }): Promise<Note> {
    return this.prisma.note.create({ data });
  }

  async update(id: string, data: { title?: string; content?: string }): Promise<Note> {
    return this.prisma.note.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Note> {
    return this.prisma.note.delete({ where: { id } });
  }
}
