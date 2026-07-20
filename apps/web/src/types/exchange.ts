export type ExchangeProvider = 'BINANCE' | 'BYBIT' | 'OKX' | 'KUCOIN' | 'GATEIO' | 'HYPERLIQUID';

export type ExchangeConnection = {
  id: string;
  exchange: ExchangeProvider;
  label: string;
  apiKeyPreview: string;
  lastImportedAt: string | null;
  createdAt: string;
};

export type CreateExchangeConnectionPayload = {
  exchange: ExchangeProvider;
  label: string;
  /** Not required for HYPERLIQUID, which uses walletAddress instead. */
  apiKey?: string;
  apiSecret?: string;
  apiPassphrase?: string;
  /** HYPERLIQUID only — the account's public wallet address, in place of apiKey/apiSecret. */
  walletAddress?: string;
};

export type ImportTradesPayload = {
  /** Omit to import every pair — only supported on some exchanges (Bybit, OKX, Hyperliquid). */
  symbols?: string[];
  portfolioId?: string;
  /** Both must be set together — omit both to use the exchange's own default recent window. */
  from?: string;
  to?: string;
};

export type ImportResult = {
  symbol: string;
  tradesImported: number;
};
