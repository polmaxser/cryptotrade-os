export type DashboardCapital = {
  current: number;
  goal: number;
  currency: string;
  progressPercent: number;
};

export type DashboardStats = {
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  todayRisk: number;
  currency: string;
};

export type DashboardTrade = {
  id: string;
  symbol: string;
  pnl: number;
};

export type DashboardAiCoach = {
  headline: string;
  advice: string;
};

export type DashboardChecklistItem = {
  id: string;
  labelKey: string;
  completed: boolean;
};

export type DashboardData = {
  capital: DashboardCapital;
  stats: DashboardStats;
  recentTrades: DashboardTrade[];
  aiCoach: DashboardAiCoach;
  checklist: DashboardChecklistItem[];
};
