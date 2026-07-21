import { NormalizedFill } from './normalized-fill';

export interface ExchangeCredentials {
  /** Empty for HYPERLIQUID, which authenticates reads by wallet address instead. */
  apiKey: string;
  apiSecret: string;
  /** Required by some exchanges (e.g. OKX), set at API key creation time. */
  apiPassphrase?: string;
  /** HYPERLIQUID only — the account's public wallet address. */
  walletAddress?: string;
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
 *
 * `symbol` is optional too, but only some exchanges support omitting it
 * (Bybit and OKX let you list executions across every pair in one sweep;
 * Binance and KuCoin's spot API require a symbol per request, with no way
 * to discover which symbols an account has ever traded). Check
 * `supportsAllSymbolsFetch` before calling without a symbol — a client
 * that doesn't support it should never be asked to.
 */
export interface ExchangeClient {
  readonly supportsAllSymbolsFetch: boolean;
  testConnection(credentials: ExchangeCredentials): Promise<void>;
  fetchFills(
    credentials: ExchangeCredentials,
    symbol: string | undefined,
    range?: FillsRange,
  ): Promise<NormalizedFill[]>;
  /**
   * Total account balance in USD (or a USD-pegged stablecoin, treated as
   * 1:1). Display-only — never used for trade matching or PnL. Exchanges
   * that already report a ready-made total (Bybit, OKX, Gate.io) return it
   * directly; others (Binance, KuCoin) sum per-asset spot balances converted
   * via the exchange's own ticker prices, since no single endpoint gives a
   * pre-converted total.
   */
  fetchBalance(credentials: ExchangeCredentials): Promise<number>;
}
