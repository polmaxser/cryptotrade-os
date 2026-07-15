export interface RMultipleStats {
  /** Average PnL expressed in multiples of risk (R = |entry − stopLoss| × quantity). */
  average: number | null;
  /** How many closed trades had a stop-loss set and contributed to the average. */
  sampleSize: number;
}

export interface MaxDrawdownStats {
  amount: number;
  /** Null unless the query is scoped to a single portfolio that has a startingBalance set. */
  percent: number | null;
}

export interface AnalyticsSummary {
  totalPnl: number;
  roi: number;
  winRate: number;
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  /** Gross profit / gross loss. Null when there are no losing trades to divide by. */
  profitFactor: number | null;
  /** Average PnL per closed trade, in the portfolio's base currency. */
  expectancy: number;
  avgWin: number;
  avgLoss: number;
  rMultiple: RMultipleStats;
  maxDrawdown: MaxDrawdownStats;
  /** Mean / stddev of per-trade PnL%. Not annualized — holding periods vary and there's no equity time series yet. Null with fewer than 2 closed trades. */
  sharpeRatioPerTrade: number | null;
}
