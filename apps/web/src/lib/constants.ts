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
};
