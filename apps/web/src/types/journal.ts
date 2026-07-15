export type JournalTagCategory = 'MISTAKE' | 'EMOTION' | 'STRATEGY';

export type JournalTag = {
  id: string;
  name: string;
  category: JournalTagCategory;
  createdAt: string;
  userId: string;
};

export type JournalEntryTrade = {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
};

export type JournalEntry = {
  id: string;
  content: string;
  screenshotUrls: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  tradeId: string | null;
  trade: JournalEntryTrade | null;
  tags: JournalTag[];
};

export type JournalEntryFilters = {
  tradeId?: string;
  tagId?: string;
};

export type CreateJournalEntryPayload = {
  content: string;
  tradeId?: string;
  tagIds?: string[];
};

export type UpdateJournalEntryPayload = {
  content?: string;
  tradeId?: string | null;
  tagIds?: string[];
};

export type CreateJournalTagPayload = {
  name: string;
  category: JournalTagCategory;
};
