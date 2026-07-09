import type { DashboardData } from '@/types/dashboard';

/**
 * Static placeholder data for the dashboard UI.
 * Replace with API fetch in `getDashboardData()` when backend is ready.
 */
export const PLACEHOLDER_DASHBOARD_DATA: DashboardData = {
  capital: {
    current: 500,
    goal: 30_000,
    currency: 'USDT',
    progressPercent: 1.67,
  },
  stats: {
    winRate: 63,
    profitFactor: 2.14,
    maxDrawdown: 4.2,
    todayRisk: 5,
    currency: 'USDT',
  },
  recentTrades: [
    { id: '1', symbol: 'BTC', pnl: 15 },
    { id: '2', symbol: 'ETH', pnl: -6 },
    { id: '3', symbol: 'SOL', pnl: 21 },
  ],
  aiCoach: {
    headline: 'volatileMarket',
    advice: 'riskLimit',
  },
  checklist: [
    { id: '1', labelKey: 'tradingPlan', completed: true },
    { id: '2', labelKey: 'sleep', completed: true },
    { id: '3', labelKey: 'maxTrades', completed: true },
    { id: '4', labelKey: 'noRevenge', completed: true },
  ],
};
