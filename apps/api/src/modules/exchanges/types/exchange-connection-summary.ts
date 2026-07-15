import { ExchangeConnection, ExchangeProvider } from '@cryptotrade/database';

export interface ExchangeConnectionSummary {
  id: string;
  exchange: ExchangeProvider;
  label: string;
  apiKeyPreview: string;
  lastImportedAt: Date | null;
  createdAt: Date;
}

export function toConnectionSummary(connection: ExchangeConnection): ExchangeConnectionSummary {
  return {
    id: connection.id,
    exchange: connection.exchange,
    label: connection.label,
    apiKeyPreview: connection.apiKeyPreview,
    lastImportedAt: connection.lastImportedAt,
    createdAt: connection.createdAt,
  };
}

export interface ImportResult {
  symbol: string;
  tradesImported: number;
}
