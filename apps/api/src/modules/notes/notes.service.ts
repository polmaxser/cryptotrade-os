import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Note } from '@cryptotrade/database';

import { NoteRepository } from './repositories/note.repository';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(private readonly noteRepository: NoteRepository) {}

  async listForUser(userId: string): Promise<Note[]> {
    return this.noteRepository.findAllByUser(userId);
  }

  async create(userId: string, dto: CreateNoteDto): Promise<Note> {
    return this.noteRepository.create({ userId, ...dto });
  }

  async update(id: string, userId: string, dto: UpdateNoteDto): Promise<Note> {
    await this.getNoteOrThrow(id, userId);
    return this.noteRepository.update(id, dto);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.getNoteOrThrow(id, userId);
    await this.noteRepository.delete(id);
  }

  private async getNoteOrThrow(id: string, userId: string): Promise<Note> {
    const note = await this.noteRepository.findById(id);

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('You do not have access to this note');
    }

    return note;
  }
}
