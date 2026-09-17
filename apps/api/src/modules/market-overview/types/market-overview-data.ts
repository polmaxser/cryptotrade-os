export interface IndexQuote {
  price: number;
  changePct: number;
  /** null for VIX/DXY/10Y yield — a calculated index/rate, not something with a meaningful traded volume. */
  volume: number | null;
}

export interface FearGreedData {
  value: number;
  classification: string;
  previousValue: number | null;
}

export interface CryptoMarketCapData {
  totalUsd: number;
  change24hPct: number;
  volume24hUsd: number;
  /** Trading volume as a % of market cap over the last 24h — a liquidity/interest read: high means the market is actively trading, not just marking up on thin volume. */
  volumeToMarketCapPct: number;
}

export interface DominanceData {
  btcPct: number;
  ethPct: number;
}

export interface TechnicalReadout {
  priceUsd: number;
  change24hPct: number;
  rsi14: number | null;
  sma50: number | null;
  sma200: number | null;
  /** Where price sits relative to its own SMA50/SMA200 — a plain-English golden/death-cross-style read. */
  trend: 'ABOVE_BOTH' | 'BELOW_BOTH' | 'MIXED' | null;
  volume24hUsd: number | null;
  avgVolume30dUsd: number | null;
  /** volume24hUsd / avgVolume30dUsd — a spike read: well above 1 means today's activity is unusually high relative to the recent baseline, in either direction the price is already moving. */
  volumeRatio: number | null;
}

export interface MarketMover {
  symbol: string;
  name: string;
  change24hPct: number;
  volumeUsd: number;
}

export interface BreadthData {
  greenCount: number;
  totalCount: number;
  topGainers: MarketMover[];
  topLosers: MarketMover[];
  /** Highest 24h volume among the same top-100 universe — "where the money is moving," independent of which direction price went. */
  topByVolume: MarketMover[];
}

export type LiquidationRisk = 'ELEVATED_LONG' | 'ELEVATED_SHORT' | 'LOW';

export interface DerivativesData {
  btcFundingRatePct: number | null;
  btcOpenInterestUsd: number | null;
  btcLongShortRatio: number | null;
  btcTakerBuySellRatio: number | null;
  /** Total trading volume across all of OKX's markets in the last 24h — a broad crypto-derivatives activity read, not BTC-specific like the fields above. */
  platformVolume24hUsd: number | null;
  liquidationRisk: LiquidationRisk | null;
}

export interface OnChainData {
  hashRate: number | null;
  difficulty: number | null;
  mempoolSizeBytes: number | null;
  estimatedTxVolumeUsd: number | null;
  transactionCount: number | null;
}

export interface NextMacroEvent {
  title: string;
  category: string;
  eventDate: string;
}

export interface MarketOverviewData {
  crypto: {
    fearGreed: FearGreedData | null;
    marketCap: CryptoMarketCapData | null;
    dominance: DominanceData | null;
    stablecoinMarketCapUsd: number | null;
    btc: TechnicalReadout | null;
    eth: TechnicalReadout | null;
    breadth: BreadthData | null;
    derivatives: DerivativesData | null;
    onChain: OnChainData | null;
  };
  usMarkets: {
    sp500: IndexQuote | null;
    nasdaq: IndexQuote | null;
    dow: IndexQuote | null;
    vix: IndexQuote | null;
    dxy: IndexQuote | null;
    us10y: IndexQuote | null;
    nextMacroEvent: NextMacroEvent | null;
  };
  /** Which sub-fetches failed this run — surfaced for debugging, not necessarily shown to every trader. */
  sourceErrors: string[];
}

export type MarketSentiment = 'RISK_ON' | 'RISK_OFF' | 'NEUTRAL';

/**
 * Every recognized sentiment-driver type — the frontend maps each to a
 * localized template (e.g. "crypto Fear & Greed at {value} (Greed)"). Kept
 * as plain type+params rather than pre-rendered text because this snapshot
 * is global (one row shared by every user, regardless of locale) — baking
 * English text in here would leak into every other language's UI.
 */
export type SentimentDriverType =
  | 'FEAR_GREED_GREED'
  | 'FEAR_GREED_FEAR'
  | 'MARKET_CAP_UP'
  | 'MARKET_CAP_DOWN'
  | 'BREADTH_GREEN'
  | 'BREADTH_RED'
  | 'LIQUIDATION_RISK_LONG'
  | 'LIQUIDATION_RISK_SHORT'
  | 'EQUITIES_UP'
  | 'EQUITIES_DOWN'
  | 'VIX_LOW'
  | 'VIX_HIGH';

export interface SentimentDriver {
  type: SentimentDriverType;
  score: 1 | -1;
  value?: number;
  total?: number;
}

export interface MarketOverviewSnapshotDto {
  capturedAt: string;
  sentiment: MarketSentiment;
  drivers: SentimentDriver[];
  data: MarketOverviewData;
}
