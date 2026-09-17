import type { MarketSentiment, SentimentDriver } from '@/types/market-overview';

type Translator = (key: string, values?: Record<string, string | number>) => string;

/**
 * Renders the same "label: driver1, driver2." sentence the backend used to
 * bake in as plain English — moved to the client because the snapshot
 * itself is global (one row shared by every locale), so the human-readable
 * text has to come from i18n templates here, not from the API response.
 */
export function buildSentimentSummary(
  sentiment: MarketSentiment,
  drivers: SentimentDriver[],
  t: Translator,
): string {
  const label = t(`sentiment.${sentiment}`);

  if (drivers.length === 0) {
    return t('summaryNoData', { label });
  }

  const sameDirection = drivers.filter((d) =>
    sentiment === 'RISK_ON' ? d.score > 0 : sentiment === 'RISK_OFF' ? d.score < 0 : true,
  );
  const chosen = (sameDirection.length > 0 ? sameDirection : drivers).slice(0, 2);
  const parts = chosen.map((driver) => t(`drivers.${driver.type}`, formatDriverParams(driver)));

  return t('summaryWithDrivers', { label, drivers: parts.join(', ') });
}

function formatDriverParams(driver: SentimentDriver): Record<string, string | number> {
  switch (driver.type) {
    case 'FEAR_GREED_GREED':
    case 'FEAR_GREED_FEAR':
      return { value: driver.value ?? 0 };
    case 'MARKET_CAP_UP':
    case 'EQUITIES_UP':
      return { value: (driver.value ?? 0).toFixed(1) };
    case 'MARKET_CAP_DOWN':
    case 'EQUITIES_DOWN':
      // Already negative — the DOWN templates don't add their own sign.
      return { value: (driver.value ?? 0).toFixed(1) };
    case 'BREADTH_GREEN':
    case 'BREADTH_RED':
      return { value: (driver.value ?? 0).toFixed(0), total: driver.total ?? 0 };
    case 'VIX_LOW':
    case 'VIX_HIGH':
      return { value: (driver.value ?? 0).toFixed(1) };
    case 'LIQUIDATION_RISK_LONG':
    case 'LIQUIDATION_RISK_SHORT':
      return {};
  }
}
