import { JournalEntry, JournalTag } from '@cryptotrade/database';

export type JournalEntryWithRelations = JournalEntry & {
  tags: JournalTag[];
  trade: { id: string; symbol: string; side: string } | null;
};
