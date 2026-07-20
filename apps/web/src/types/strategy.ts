export type Strategy = {
  id: string;
  name: string;
  description: string | null;
  entryCriteria: string | null;
  exitCriteria: string | null;
  riskManagement: string | null;
  timeframe: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type CreateStrategyPayload = {
  name: string;
  description?: string;
  entryCriteria?: string;
  exitCriteria?: string;
  riskManagement?: string;
  timeframe?: string;
  isActive?: boolean;
};

export type UpdateStrategyPayload = Partial<CreateStrategyPayload>;

export type StrategyPerformance = {
  totalPnl: number;
  roi: number;
  winRate: number;
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitFactor: number | null;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
  rMultiple: { average: number | null; sampleSize: number };
  maxDrawdown: { amount: number; percent: number | null };
  sharpeRatioPerTrade: number | null;
};
