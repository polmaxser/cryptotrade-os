import { NormalizedFill } from './normalized-fill';

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  /** Required by some exchanges (e.g. OKX), set at API key creation time. */
  apiPassphrase?: string;
}

/**
 * Every exchange integration implements this. Only ever read-only —
 * connection validation and trade-history retrieval, never order placement
 * or withdrawal.
 */
export interface ExchangeClient {
  testConnection(credentials: ExchangeCredentials): Promise<void>;
  fetchFills(credentials: ExchangeCredentials, symbol: string): Promise<NormalizedFill[]>;
}
