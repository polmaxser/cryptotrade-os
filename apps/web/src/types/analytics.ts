export type RMultipleStats = {
  average: number | null;
  sampleSize: number;
};

export type MaxDrawdownStats = {
  amount: number;
  percent: number | null;
};

export type AnalyticsSummary = {
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
  rMultiple: RMultipleStats;
  maxDrawdown: MaxDrawdownStats;
  sharpeRatioPerTrade: number | null;
};
