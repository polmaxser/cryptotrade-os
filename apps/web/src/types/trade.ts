export type TradeSide = 'LONG' | 'SHORT';
export type TradeStatus = 'OPEN' | 'CLOSED';
export type MarginType = 'ISOLATED' | 'CROSS';

export type Trade = {
  id: string;
  symbol: string;
  side: TradeSide;
  strategy: string | null;
  strategyId: string | null;
  entryPrice: string;
  exitPrice: string | null;
  stopLossPrice: string | null;
  leverage: number | null;
  marginType: MarginType | null;
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

export type CreateTradePayload = {
  symbol: string;
  side: TradeSide;
  strategy?: string;
  strategyId?: string;
  entryPrice: number;
  exitPrice?: number;
  stopLossPrice?: number;
  leverage?: number;
  marginType?: MarginType;
  quantity: number;
  pnl?: number;
  pnlPercent?: number;
  status?: TradeStatus;
  notes?: string;
  openedAt: string;
  closedAt?: string;
  portfolioId?: string;
};

export type UpdateTradePayload = Partial<CreateTradePayload>;
