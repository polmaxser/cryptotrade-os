import { MarketOverviewData, MarketSentiment, SentimentDriver } from './types/market-overview-data';

/**
 * A deterministic "current regime" read — Risk-On/Risk-Off/Neutral — built
 * from simple, transparent rules over the fetched indicators. This is NOT a
 * price forecast (no combination of public indicators reliably predicts
 * where price goes next); it's a same-day snapshot of whether conditions
 * lean risk-seeking or risk-averse, for the trader to weigh alongside their
 * own read. Each rule contributes at most ±1 so no single source dominates.
 */
export function computeSentiment(data: MarketOverviewData): {
  sentiment: MarketSentiment;
  drivers: SentimentDriver[];
} {
  const drivers: SentimentDriver[] = [];

  const fearGreed = data.crypto.fearGreed;
  if (fearGreed) {
    if (fearGreed.value >= 55)
      drivers.push({ type: 'FEAR_GREED_GREED', score: 1, value: fearGreed.value });
    else if (fearGreed.value <= 45)
      drivers.push({ type: 'FEAR_GREED_FEAR', score: -1, value: fearGreed.value });
  }

  const marketCap = data.crypto.marketCap;
  if (marketCap) {
    if (marketCap.change24hPct >= 1)
      drivers.push({ type: 'MARKET_CAP_UP', score: 1, value: marketCap.change24hPct });
    else if (marketCap.change24hPct <= -1)
      drivers.push({ type: 'MARKET_CAP_DOWN', score: -1, value: marketCap.change24hPct });
  }

  const breadth = data.crypto.breadth;
  if (breadth && breadth.totalCount > 0) {
    const greenPct = (breadth.greenCount / breadth.totalCount) * 100;
    if (greenPct >= 60)
      drivers.push({ type: 'BREADTH_GREEN', score: 1, value: greenPct, total: breadth.totalCount });
    else if (greenPct <= 40)
      drivers.push({ type: 'BREADTH_RED', score: -1, value: greenPct, total: breadth.totalCount });
  }

  const risk = data.crypto.derivatives?.liquidationRisk;
  if (risk === 'ELEVATED_LONG') drivers.push({ type: 'LIQUIDATION_RISK_LONG', score: -1 });
  else if (risk === 'ELEVATED_SHORT') drivers.push({ type: 'LIQUIDATION_RISK_SHORT', score: 1 });

  const equityAvg = averageChangePct([
    data.usMarkets.sp500,
    data.usMarkets.nasdaq,
    data.usMarkets.dow,
  ]);
  if (equityAvg !== null) {
    if (equityAvg >= 0.3) drivers.push({ type: 'EQUITIES_UP', score: 1, value: equityAvg });
    else if (equityAvg <= -0.3)
      drivers.push({ type: 'EQUITIES_DOWN', score: -1, value: equityAvg });
  }

  const vix = data.usMarkets.vix;
  if (vix) {
    if (vix.price < 15) drivers.push({ type: 'VIX_LOW', score: 1, value: vix.price });
    else if (vix.price > 25) drivers.push({ type: 'VIX_HIGH', score: -1, value: vix.price });
  }

  const totalScore = drivers.reduce((sum, d) => sum + d.score, 0);

  let sentiment: MarketSentiment;
  if (totalScore >= 2) sentiment = 'RISK_ON';
  else if (totalScore <= -2) sentiment = 'RISK_OFF';
  else sentiment = 'NEUTRAL';

  return { sentiment, drivers };
}

function averageChangePct(quotes: Array<{ changePct: number } | null>): number | null {
  const values = quotes
    .filter((q): q is { changePct: number } => q !== null)
    .map((q) => q.changePct);
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
