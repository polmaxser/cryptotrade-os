export type TradeSide = 'LONG' | 'SHORT';
export type TradeStatus = 'OPEN' | 'CLOSED';

export type Trade = {
  id: string;
  symbol: string;
  side: TradeSide;
  strategy: string | null;
  entryPrice: string;
  exitPrice: string | null;
  quantity: string;
  pnl: string | null;
  pnlPercent: string | null;
  status: TradeStatus;
  notes: string | null;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  portfolioId: string | null;
};
