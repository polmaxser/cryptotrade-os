import { NormalizedFill } from './normalized-fill';

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  /** Required by some exchanges (e.g. OKX), set at API key creation time. */
  apiPassphrase?: string;
}

export interface FillsRange {
  from: Date;
  to: Date;
}

/**
 * Every exchange integration implements this. Only ever read-only —
 * connection validation and trade-history retrieval, never order placement
 * or withdrawal.
 *
 * `range` is optional. Without it, a client returns the exchange's own
 * default recent window (each exchange defines this differently — e.g.
 * Bybit defaults to the last 7 days), but must fully paginate within that
 * window rather than silently returning only the first page. With a range,
 * a client must cover the whole [from, to] window, chunked to each
 * exchange's own max-window-per-request limit and fully paginated within
 * each chunk — that's how a trader reaches older history.
 */
export interface ExchangeClient {
  testConnection(credentials: ExchangeCredentials): Promise<void>;
  fetchFills(
    credentials: ExchangeCredentials,
    symbol: string,
    range?: FillsRange,
  ): Promise<NormalizedFill[]>;
}
