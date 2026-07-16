export type ExchangeProvider = 'BINANCE' | 'BYBIT' | 'OKX' | 'KUCOIN';

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
  apiKey: string;
  apiSecret: string;
  apiPassphrase?: string;
};

export type ImportTradesPayload = {
  symbols: string[];
  portfolioId?: string;
};

export type ImportResult = {
  symbol: string;
  tradesImported: number;
};
