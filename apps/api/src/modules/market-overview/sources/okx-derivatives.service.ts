import { Injectable, Logger } from '@nestjs/common';

import { DerivativesData, LiquidationRisk } from '../types/market-overview-data';

const OKX_BASE_URL = 'https://www.okx.com';
const BTC_SWAP = 'BTC-USDT-SWAP';

/** Funding rate (% per 8h) beyond which longs/shorts are considered crowded enough to flag liquidation risk. */
const HOT_FUNDING_RATE_PCT = 0.03;
/**
 * OKX's long/short *account* ratio normally sits well above 1 (retail tends
 * to run long) — these thresholds are set by inspection of typical resting
 * values, not a back-tested model, and only flag a ratio meaningfully past
 * that usual band in either direction.
 */
const EXTREME_LONG_RATIO = 2.5;
const EXTREME_SHORT_RATIO = 0.7;

interface OkxEnvelope<T> {
  code: string;
  data: T;
}

/**
 * Public (unauthenticated) OKX derivatives market data — funding rate, open
 * interest, long/short positioning, taker flow for BTC perps. Distinct from
 * OkxClientService, which signs requests against a *user's own* connected
 * account; this is market-wide data anyone can read.
 */
@Injectable()
export class OkxDerivativesService {
  private readonly logger = new Logger(OkxDerivativesService.name);

  async fetch(): Promise<DerivativesData | null> {
    const [fundingRate, openInterest, longShortRatio, takerVolume, platformVolume] =
      await Promise.all([
        this.fetchFundingRate(),
        this.fetchOpenInterest(),
        this.fetchLongShortRatio(),
        this.fetchTakerVolume(),
        this.fetchPlatformVolume(),
      ]);

    if (
      fundingRate === null &&
      openInterest === null &&
      longShortRatio === null &&
      takerVolume === null &&
      platformVolume === null
    ) {
      return null;
    }

    return {
      btcFundingRatePct: fundingRate,
      btcOpenInterestUsd: openInterest,
      btcLongShortRatio: longShortRatio,
      btcTakerBuySellRatio: takerVolume,
      platformVolume24hUsd: platformVolume,
      liquidationRisk: this.assessLiquidationRisk(fundingRate, longShortRatio),
    };
  }

  /**
   * Heuristic, not a real liquidation map (those require a paid provider
   * like Coinglass — nothing free exposes actual leveraged-position price
   * levels). Flags crowded, expensive-to-hold positioning as elevated risk
   * of a liquidation-driven move in the *opposite* direction: very positive
   * funding means longs are paying heavily to stay in, and a downside flush
   * would cascade through them; an unusually long-skewed ratio is treated
   * as an independent confirming signal of the same risk (mirror logic for
   * shorts on both).
   */
  private assessLiquidationRisk(
    fundingRatePct: number | null,
    longShortRatio: number | null,
  ): LiquidationRisk | null {
    if (fundingRatePct === null && longShortRatio === null) return null;

    const hotLongFunding = fundingRatePct !== null && fundingRatePct >= HOT_FUNDING_RATE_PCT;
    const hotShortFunding = fundingRatePct !== null && fundingRatePct <= -HOT_FUNDING_RATE_PCT;
    const skewedLongRatio = longShortRatio !== null && longShortRatio > EXTREME_LONG_RATIO;
    const skewedShortRatio = longShortRatio !== null && longShortRatio < EXTREME_SHORT_RATIO;

    if (hotLongFunding || skewedLongRatio) return 'ELEVATED_LONG';
    if (hotShortFunding || skewedShortRatio) return 'ELEVATED_SHORT';

    return 'LOW';
  }

  private async fetchFundingRate(): Promise<number | null> {
    try {
      const payload = await this.getJson<OkxEnvelope<Array<{ fundingRate: string }>>>(
        `/api/v5/public/funding-rate?instId=${BTC_SWAP}`,
      );

      const rate = payload.data[0]?.fundingRate;
      return rate !== undefined ? Number(rate) * 100 : null;
    } catch (err) {
      this.logger.warn(`Failed to fetch OKX funding rate: ${(err as Error).message}`);
      return null;
    }
  }

  private async fetchOpenInterest(): Promise<number | null> {
    try {
      const payload = await this.getJson<OkxEnvelope<Array<{ oiUsd: string }>>>(
        `/api/v5/public/open-interest?instId=${BTC_SWAP}`,
      );

      const oi = payload.data[0]?.oiUsd;
      return oi !== undefined ? Number(oi) : null;
    } catch (err) {
      this.logger.warn(`Failed to fetch OKX open interest: ${(err as Error).message}`);
      return null;
    }
  }

  private async fetchLongShortRatio(): Promise<number | null> {
    try {
      const payload = await this.getJson<OkxEnvelope<[string, string][]>>(
        `/api/v5/rubik/stat/contracts/long-short-account-ratio-contract?instId=${BTC_SWAP}&period=1H`,
      );

      const latest = payload.data[0]?.[1];
      return latest !== undefined ? Number(latest) : null;
    } catch (err) {
      this.logger.warn(`Failed to fetch OKX long/short ratio: ${(err as Error).message}`);
      return null;
    }
  }

  /** [timestamp, sellVolume, buyVolume] per OKX's own field order. Ratio > 1 means takers are buying more aggressively than selling. */
  private async fetchTakerVolume(): Promise<number | null> {
    try {
      const payload = await this.getJson<OkxEnvelope<[string, string, string][]>>(
        `/api/v5/rubik/stat/taker-volume-contract?instId=${BTC_SWAP}&period=1H`,
      );

      const latest = payload.data[0];
      if (!latest) return null;

      const sellVol = Number(latest[1]);
      const buyVol = Number(latest[2]);
      if (sellVol === 0) return null;

      return buyVol / sellVol;
    } catch (err) {
      this.logger.warn(`Failed to fetch OKX taker volume: ${(err as Error).message}`);
      return null;
    }
  }

  /** All of OKX's markets combined (spot + derivatives), not just BTC — the broadest single "how active is crypto trading right now" volume figure available for free. */
  private async fetchPlatformVolume(): Promise<number | null> {
    try {
      const payload = await this.getJson<OkxEnvelope<Array<{ volUsd: string }>>>(
        '/api/v5/market/platform-24-volume',
      );

      const vol = payload.data[0]?.volUsd;
      return vol !== undefined ? Number(vol) : null;
    } catch (err) {
      this.logger.warn(`Failed to fetch OKX platform volume: ${(err as Error).message}`);
      return null;
    }
  }

  private async getJson<T>(path: string): Promise<T> {
    const response = await fetch(`${OKX_BASE_URL}${path}`);
    if (!response.ok) throw new Error(`status ${response.status}`);
    return response.json() as Promise<T>;
  }
}
