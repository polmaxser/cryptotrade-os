export type CoachInsightPattern =
  | 'REVENGE_TRADING'
  | 'HOLDING_LOSERS_TOO_LONG'
  | 'CUTTING_WINNERS_SHORT'
  | 'TIME_OF_DAY_WEAKNESS'
  | 'TAG_CORRELATION'
  | 'OVERTRADING'
  | 'POSITION_SIZE_INCONSISTENCY';

export type CoachInsightStatus = 'NEW' | 'CONFIRMED' | 'DISMISSED';

export type CoachInsight = {
  id: string;
  pattern: CoachInsightPattern;
  status: CoachInsightStatus;
  title: string;
  description: string;
  metrics: Record<string, number | string>;
  relatedTradeIds: string[];
  periodStart: string;
  periodEnd: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
};
