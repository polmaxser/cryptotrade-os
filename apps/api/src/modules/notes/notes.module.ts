import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/common/database/database.module';

import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { NoteRepository } from './repositories/note.repository';

@Module({
  imports: [DatabaseModule],

  controllers: [NotesController],

  providers: [NotesService, NoteRepository],

  exports: [NotesService],
})
export class NotesModule {}
