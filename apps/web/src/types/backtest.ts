export type BacktestTemplate = 'MA_CROSSOVER' | 'RSI_THRESHOLD' | 'DONCHIAN_BREAKOUT';

export type BacktestTrade = {
  side: 'LONG';
  entryTime: number;
  entryPrice: number;
  exitTime: number;
  exitPrice: number;
  pnlPercent: number;
};

export type EquityPoint = {
  time: number;
  equity: number;
};

export type BacktestSummary = {
  totalTrades: number;
  winRate: number;
  totalPnlPercent: number;
  profitFactor: number | null;
  maxDrawdownPercent: number;
  finalEquity: number;
};

export type BacktestRun = {
  id: string;
  template: BacktestTemplate;
  symbol: string;
  timeframe: string;
  periodStart: string;
  periodEnd: string;
  params: Record<string, number>;
  startingCapital: string;
  feePercent: string;
  summary: BacktestSummary;
  equityCurve: EquityPoint[];
  trades: BacktestTrade[];
  strategyId: string | null;
  createdAt: string;
  userId: string;
};

export type RunBacktestPayload = {
  template: BacktestTemplate;
  symbol: string;
  timeframe: string;
  from: string;
  to: string;
  startingCapital: number;
  feePercent?: number;
  params: Record<string, number>;
  strategyId?: string;
};
