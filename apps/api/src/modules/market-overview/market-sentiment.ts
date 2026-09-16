import { MarketOverviewData, MarketSentiment } from './types/market-overview-data';

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
  summary: string;
} {
  const signals: { label: string; score: number }[] = [];

  const fearGreed = data.crypto.fearGreed;
  if (fearGreed) {
    if (fearGreed.value >= 55)
      signals.push({ label: `crypto Fear & Greed at ${fearGreed.value} (Greed)`, score: 1 });
    else if (fearGreed.value <= 45)
      signals.push({ label: `crypto Fear & Greed at ${fearGreed.value} (Fear)`, score: -1 });
  }

  const marketCap = data.crypto.marketCap;
  if (marketCap) {
    if (marketCap.change24hPct >= 1)
      signals.push({
        label: `crypto market cap +${marketCap.change24hPct.toFixed(1)}% (24h)`,
        score: 1,
      });
    else if (marketCap.change24hPct <= -1)
      signals.push({
        label: `crypto market cap ${marketCap.change24hPct.toFixed(1)}% (24h)`,
        score: -1,
      });
  }

  const breadth = data.crypto.breadth;
  if (breadth && breadth.totalCount > 0) {
    const greenPct = (breadth.greenCount / breadth.totalCount) * 100;
    if (greenPct >= 60)
      signals.push({
        label: `${greenPct.toFixed(0)}% of top ${breadth.totalCount} coins green`,
        score: 1,
      });
    else if (greenPct <= 40)
      signals.push({
        label: `${greenPct.toFixed(0)}% of top ${breadth.totalCount} coins green`,
        score: -1,
      });
  }

  const risk = data.crypto.derivatives?.liquidationRisk;
  if (risk === 'ELEVATED_LONG')
    signals.push({ label: 'crowded long positioning in BTC perps', score: -1 });
  else if (risk === 'ELEVATED_SHORT')
    signals.push({ label: 'crowded short positioning in BTC perps', score: 1 });

  const equityAvg = averageChangePct([
    data.usMarkets.sp500,
    data.usMarkets.nasdaq,
    data.usMarkets.dow,
  ]);
  if (equityAvg !== null) {
    if (equityAvg >= 0.3)
      signals.push({ label: `US equities avg +${equityAvg.toFixed(1)}%`, score: 1 });
    else if (equityAvg <= -0.3)
      signals.push({ label: `US equities avg ${equityAvg.toFixed(1)}%`, score: -1 });
  }

  const vix = data.usMarkets.vix;
  if (vix) {
    if (vix.price < 15) signals.push({ label: `VIX low at ${vix.price.toFixed(1)}`, score: 1 });
    else if (vix.price > 25)
      signals.push({ label: `VIX elevated at ${vix.price.toFixed(1)}`, score: -1 });
  }

  const totalScore = signals.reduce((sum, s) => sum + s.score, 0);

  let sentiment: MarketSentiment;
  if (totalScore >= 2) sentiment = 'RISK_ON';
  else if (totalScore <= -2) sentiment = 'RISK_OFF';
  else sentiment = 'NEUTRAL';

  return { sentiment, summary: buildSummary(sentiment, signals) };
}

function averageChangePct(quotes: Array<{ changePct: number } | null>): number | null {
  const values = quotes
    .filter((q): q is { changePct: number } => q !== null)
    .map((q) => q.changePct);
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function buildSummary(
  sentiment: MarketSentiment,
  signals: { label: string; score: number }[],
): string {
  const label =
    sentiment === 'RISK_ON' ? 'Risk-On' : sentiment === 'RISK_OFF' ? 'Risk-Off' : 'Neutral';

  if (signals.length === 0) {
    return `${label}: not enough data this run to point to a clear driver.`;
  }

  const sameDirection = signals.filter((s) =>
    sentiment === 'RISK_ON' ? s.score > 0 : sentiment === 'RISK_OFF' ? s.score < 0 : true,
  );
  const drivers = (sameDirection.length > 0 ? sameDirection : signals)
    .slice(0, 2)
    .map((s) => s.label)
    .join(', ');

  return `${label}: ${drivers}.`;
}
