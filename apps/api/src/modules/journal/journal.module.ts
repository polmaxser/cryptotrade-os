import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/common/database/database.module';
import { TradesModule } from '@/modules/trades/trades.module';
import { StorageModule } from '@/modules/storage/storage.module';

import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';
import { JournalEntryRepository } from './repositories/journal-entry.repository';
import { JournalTagRepository } from './repositories/journal-tag.repository';

@Module({
  imports: [DatabaseModule, TradesModule, StorageModule],

  controllers: [JournalController],

  providers: [JournalService, JournalEntryRepository, JournalTagRepository],

  exports: [JournalService, JournalEntryRepository],
})
export class JournalModule {}
