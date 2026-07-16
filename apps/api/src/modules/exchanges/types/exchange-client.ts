import { NormalizedFill } from './normalized-fill';

/**
 * Every exchange integration implements this. Only ever read-only —
 * connection validation and trade-history retrieval, never order placement
 * or withdrawal.
 */
export interface ExchangeClient {
  testConnection(apiKey: string, apiSecret: string): Promise<void>;
  fetchFills(apiKey: string, apiSecret: string, symbol: string): Promise<NormalizedFill[]>;
}
