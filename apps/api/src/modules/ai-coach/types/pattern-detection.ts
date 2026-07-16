import { CoachInsightPattern, JournalTagCategory } from '@cryptotrade/database';

export interface CoachTradeInput {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  entryPrice: number;
  pnl: number | null;
  status: string;
  openedAt: Date;
  closedAt: Date | null;
}

export interface CoachJournalTagInput {
  tradeId: string;
  tags: { id: string; name: string; category: JournalTagCategory }[];
}

export interface PatternFinding {
  pattern: CoachInsightPattern;
  metrics: Record<string, number | string>;
  relatedTradeIds: string[];
}
