import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  async list(@CurrentUser('id') userId: string) {
    return this.notesService.listForUser(userId);
  }

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateNoteDto) {
    return this.notesService.create(userId, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.update(id, userId, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.notesService.remove(id, userId);
    return { success: true };
  }
}
