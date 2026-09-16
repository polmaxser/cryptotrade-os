import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EconomicEvent, MarketOverviewSnapshot, Prisma } from '@cryptotrade/database';

import { CacheService } from '@/common/cache/cache.service';
import { PrismaService } from '@/common/database/prisma.service';
import { MarketDataService } from '@/modules/market-data/market-data.service';
import { EconomicEventRepository } from '@/modules/economic-calendar/repositories/economic-event.repository';

import { FearGreedService } from './sources/fear-greed.service';
import { YahooFinanceService, YAHOO_SYMBOLS } from './sources/yahoo-finance.service';
import { OkxDerivativesService } from './sources/okx-derivatives.service';
import { OnChainService } from './sources/onchain.service';
import { CryptoMarketService } from './sources/crypto-market.service';
import { computeSentiment } from './market-sentiment';
import {
  MarketOverviewData,
  MarketOverviewSnapshotDto,
  NextMacroEvent,
} from './types/market-overview-data';

const CACHE_KEY = 'market-overview:latest';
const CACHE_TTL_SECONDS = 15 * 60;
const NEXT_EVENT_LOOKAHEAD_DAYS = 30;
/**
 * CoinGecko's free public rate limit is tight enough that firing several
 * calls at once (this refresh makes ~6 CoinGecko-backed calls) reliably
 * trips a 429 — spacing them out, one at a time, stays under it. Refreshes
 * only happen on a cache miss (every ~15min) or the daily cron, so the
 * extra few seconds this adds don't sit in anyone's request path.
 */
const COINGECKO_CALL_SPACING_MS = 3000;

@Injectable()
export class MarketOverviewService {
  private readonly logger = new Logger(MarketOverviewService.name);

  constructor(
    private readonly cache: CacheService,
    private readonly prisma: PrismaService,
    private readonly marketDataService: MarketDataService,
    private readonly economicEventRepository: EconomicEventRepository,
    private readonly fearGreedService: FearGreedService,
    private readonly yahooFinanceService: YahooFinanceService,
    private readonly okxDerivativesService: OkxDerivativesService,
    private readonly onChainService: OnChainService,
    private readonly cryptoMarketService: CryptoMarketService,
  ) {}

  async getLatest(): Promise<MarketOverviewSnapshotDto> {
    const cached = await this.cache.get<MarketOverviewSnapshotDto>(CACHE_KEY);
    if (cached) return cached;

    return this.refreshSnapshot();
  }

  /** Pre-warms the cache once a day so the first trader to open the page isn't the one waiting on ~10 external calls. */
  @Cron('0 13 * * *')
  async runDailyRefresh(): Promise<void> {
    try {
      await this.refreshSnapshot();
    } catch (err) {
      this.logger.warn(`Daily market overview refresh failed: ${(err as Error).message}`);
    }
  }

  private async refreshSnapshot(): Promise<MarketOverviewSnapshotDto> {
    const data = await this.fetchAll();
    const { sentiment, summary } = computeSentiment(data);

    const row = await this.prisma.marketOverviewSnapshot.create({
      data: {
        sentiment,
        summary,
        data: data as unknown as Prisma.InputJsonValue,
      },
    });

    const dto = this.toDto(row, data);
    await this.cache.set(CACHE_KEY, dto, CACHE_TTL_SECONDS);

    return dto;
  }

  private async fetchAll(): Promise<MarketOverviewData> {
    const sourceErrors: string[] = [];
    const track = <T>(name: string, result: PromiseSettledResult<T>): T | null => {
      if (result.status === 'fulfilled') return result.value;
      sourceErrors.push(name);
      return null;
    };

    // Non-CoinGecko sources don't share a rate limit, so these run in parallel.
    const [
      fearGreedResult,
      derivativesResult,
      onChainResult,
      sp500Result,
      nasdaqResult,
      dowResult,
      vixResult,
      dxyResult,
      us10yResult,
      nextEventResult,
    ] = await Promise.allSettled([
      this.fearGreedService.fetch(),
      this.okxDerivativesService.fetch(),
      this.onChainService.fetch(),
      this.yahooFinanceService.fetchQuote(YAHOO_SYMBOLS.sp500),
      this.yahooFinanceService.fetchQuote(YAHOO_SYMBOLS.nasdaq),
      this.yahooFinanceService.fetchQuote(YAHOO_SYMBOLS.dow),
      this.yahooFinanceService.fetchQuote(YAHOO_SYMBOLS.vix),
      this.yahooFinanceService.fetchQuote(YAHOO_SYMBOLS.dxy),
      this.yahooFinanceService.fetchQuote(YAHOO_SYMBOLS.us10y),
      this.fetchNextMacroEvent(),
    ]);

    // CoinGecko-backed sources: one at a time, spaced out — see COINGECKO_CALL_SPACING_MS.
    const prices = await this.trySource(sourceErrors, 'crypto-prices', () =>
      this.marketDataService.getPrices(['bitcoin', 'ethereum']),
    );
    await this.sleep(COINGECKO_CALL_SPACING_MS);

    const global = await this.trySource(sourceErrors, 'crypto-global', () =>
      this.cryptoMarketService.fetchGlobal(),
    );
    await this.sleep(COINGECKO_CALL_SPACING_MS);

    const breadth = await this.trySource(sourceErrors, 'crypto-breadth', () =>
      this.cryptoMarketService.fetchBreadth(),
    );
    await this.sleep(COINGECKO_CALL_SPACING_MS);

    const stablecoinMarketCapUsd = await this.trySource(sourceErrors, 'stablecoin-market-cap', () =>
      this.cryptoMarketService.fetchStablecoinMarketCap(),
    );
    await this.sleep(COINGECKO_CALL_SPACING_MS);

    const btcPrice = prices?.bitcoin;
    const btc = btcPrice
      ? await this.trySource(sourceErrors, 'btc-technicals', () =>
          this.cryptoMarketService.fetchTechnicals('bitcoin', btcPrice.usd, btcPrice.usd24hChange),
        )
      : null;
    await this.sleep(COINGECKO_CALL_SPACING_MS);

    const ethPrice = prices?.ethereum;
    const eth = ethPrice
      ? await this.trySource(sourceErrors, 'eth-technicals', () =>
          this.cryptoMarketService.fetchTechnicals('ethereum', ethPrice.usd, ethPrice.usd24hChange),
        )
      : null;

    return {
      crypto: {
        fearGreed: track('fear-greed', fearGreedResult),
        marketCap: global?.marketCap ?? null,
        dominance: global?.dominance ?? null,
        stablecoinMarketCapUsd: stablecoinMarketCapUsd ?? null,
        btc: btc ?? null,
        eth: eth ?? null,
        breadth: breadth ?? null,
        derivatives: track('okx-derivatives', derivativesResult),
        onChain: track('on-chain', onChainResult),
      },
      usMarkets: {
        sp500: track('yahoo-sp500', sp500Result),
        nasdaq: track('yahoo-nasdaq', nasdaqResult),
        dow: track('yahoo-dow', dowResult),
        vix: track('yahoo-vix', vixResult),
        dxy: track('yahoo-dxy', dxyResult),
        us10y: track('yahoo-us10y', us10yResult),
        nextMacroEvent: track('next-macro-event', nextEventResult),
      },
      sourceErrors,
    };
  }

  private async trySource<T>(
    sourceErrors: string[],
    name: string,
    fn: () => Promise<T>,
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (err) {
      this.logger.warn(`Market overview source "${name}" failed: ${(err as Error).message}`);
      sourceErrors.push(name);
      return null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async fetchNextMacroEvent(): Promise<NextMacroEvent | null> {
    const from = new Date();
    const to = new Date(from.getTime() + NEXT_EVENT_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);
    const events = await this.economicEventRepository.findInRange(from, to);
    return this.toNextMacroEvent(events[0]);
  }

  private toNextMacroEvent(event: EconomicEvent | undefined): NextMacroEvent | null {
    if (!event) return null;

    return {
      title: event.title,
      category: event.category,
      eventDate: event.eventDate.toISOString(),
    };
  }

  private toDto(row: MarketOverviewSnapshot, data: MarketOverviewData): MarketOverviewSnapshotDto {
    return {
      capturedAt: row.capturedAt.toISOString(),
      sentiment: row.sentiment,
      summary: row.summary,
      data,
    };
  }
}
