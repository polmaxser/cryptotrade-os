import { Injectable, Logger } from '@nestjs/common';

import { FearGreedData } from '../types/market-overview-data';

const FEAR_GREED_URL = 'https://api.alternative.me/fng/?limit=2';

interface FearGreedResponse {
  data: Array<{ value: string; value_classification: string }>;
}

/** Crypto Fear & Greed Index — free, unauthenticated, updated daily. */
@Injectable()
export class FearGreedService {
  private readonly logger = new Logger(FearGreedService.name);

  async fetch(): Promise<FearGreedData | null> {
    try {
      const response = await fetch(FEAR_GREED_URL);
      if (!response.ok) throw new Error(`status ${response.status}`);

      const payload = (await response.json()) as FearGreedResponse;
      const [today, yesterday] = payload.data;

      if (!today) return null;

      return {
        value: Number(today.value),
        classification: today.value_classification,
        previousValue: yesterday ? Number(yesterday.value) : null,
      };
    } catch (err) {
      this.logger.warn(`Failed to fetch Fear & Greed index: ${(err as Error).message}`);
      return null;
    }
  }
}
