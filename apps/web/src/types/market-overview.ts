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
  trend: 'ABOVE_BOTH' | 'BELOW_BOTH' | 'MIXED' | null;
  volume24hUsd: number | null;
  avgVolume30dUsd: number | null;
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
  topByVolume: MarketMover[];
}

export type LiquidationRisk = 'ELEVATED_LONG' | 'ELEVATED_SHORT' | 'LOW';

export interface DerivativesData {
  btcFundingRatePct: number | null;
  btcOpenInterestUsd: number | null;
  btcLongShortRatio: number | null;
  btcTakerBuySellRatio: number | null;
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
  sourceErrors: string[];
}

export type MarketSentiment = 'RISK_ON' | 'RISK_OFF' | 'NEUTRAL';

export interface MarketOverviewSnapshot {
  capturedAt: string;
  sentiment: MarketSentiment;
  summary: string;
  data: MarketOverviewData;
}
