export const APP_CONFIG = {
  name: 'CryptoTrade OS',
  defaultTheme: 'dark' as const,
  supportedLocales: ['en', 'ru'] as const,
};

export const QUERY_KEYS = {
  health: ['health'] as const,
  analyticsSummary: (portfolioId?: string) =>
    ['analytics', 'summary', portfolioId ?? 'all'] as const,
  trades: ['trades'] as const,
  portfolios: ['portfolios'] as const,
  workspaces: ['workspaces'] as const,
  workspace: (workspaceId: string) => ['workspaces', workspaceId] as const,
  workspaceMembers: (workspaceId: string) => ['workspaces', workspaceId, 'members'] as const,
  workspaceInvitations: (workspaceId: string) =>
    ['workspaces', workspaceId, 'invitations'] as const,
  invitationPreview: (token: string) => ['invitations', token] as const,
  billingPlans: ['billing', 'plans'] as const,
  subscription: ['billing', 'subscription'] as const,
  journalEntries: (filters?: { tradeId?: string; tagId?: string }) =>
    ['journal', 'entries', filters?.tradeId ?? 'any', filters?.tagId ?? 'any'] as const,
  journalTags: (category?: string) => ['journal', 'tags', category ?? 'all'] as const,
  watchlist: ['watchlist'] as const,
  coinSearch: (query: string) => ['watchlist', 'search', query] as const,
  alerts: ['alerts'] as const,
  notes: ['notes'] as const,
  calendarMonth: (month: string) => ['calendar', month] as const,
  exchangeConnections: ['exchanges', 'connections'] as const,
  defiPositions: ['defi-positions'] as const,
  nftHoldings: ['nft-holdings'] as const,
  coachInsights: (status?: string) => ['coach-insights', status ?? 'all'] as const,
  aiReports: (type?: string) => ['ai-reports', type ?? 'all'] as const,
  strategies: ['strategies'] as const,
  strategyPerformance: (id: string) => ['strategies', id, 'performance'] as const,
  backtestRuns: ['backtests'] as const,
  economicEvents: (from: string, to: string, category?: string) =>
    ['economic-calendar', from, to, category ?? 'all'] as const,
  adminUsers: (search: string, page: number) => ['admin', 'users', search, page] as const,
  adminPromoCodes: ['admin', 'promo-codes'] as const,
  adminEconomicEvents: (from: string, to: string, category?: string) =>
    ['admin', 'economic-events', from, to, category ?? 'all'] as const,
};
