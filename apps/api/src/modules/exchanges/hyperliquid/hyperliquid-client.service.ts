import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';

import { ExchangeClient, ExchangeCredentials, FillsRange } from '../types/exchange-client';
import { NormalizedFill } from '../types/normalized-fill';

const HYPERLIQUID_INFO_URL = 'https://api.hyperliquid.xyz/info';
const WALLET_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
/** userFillsByTime returns at most this many fills per call — used to detect "more pages follow". */
const PAGE_LIMIT = 2000;
/** Only the 10,000 most recent fills are available at all, per Hyperliquid's docs. */
const MAX_PAGES = 5;

interface HyperliquidFill {
  coin: string;
  px: string;
  sz: string;
  /** "B"/"A" for perps, "Buy"/"Sell" for spot. */
  side: string;
  time: number;
  tid: number;
}

/**
 * Thin, read-only wrapper over Hyperliquid's public `/info` endpoint.
 *
 * Unlike every other exchange integration here, this one is NOT signed —
 * Hyperliquid's userFills/userFillsByTime reads are keyed only on a public
 * wallet address, with no API key, secret, or signature involved at all.
 * That also means "connecting" a Hyperliquid account doesn't prove
 * ownership the way a signed API key does elsewhere — it only proves the
 * address is well-formed. This is a deliberate, documented tradeoff of a
 * read-only, order-placement-never integration: anyone can already read
 * anyone's fills on Hyperliquid directly, since the chain's trade history
 * is public.
 */
@Injectable()
export class HyperliquidClientService implements ExchangeClient {
  /** Every fill already carries its own coin — no need to ask per symbol. */
  readonly supportsAllSymbolsFetch = true;

  async testConnection(credentials: ExchangeCredentials): Promise<void> {
    const walletAddress = requireWalletAddress(credentials);
    await this.postInfo<HyperliquidFill[]>({ type: 'userFills', user: walletAddress });
  }

  async fetchFills(
    credentials: ExchangeCredentials,
    symbol: string | undefined,
    range?: FillsRange,
  ): Promise<NormalizedFill[]> {
    const walletAddress = requireWalletAddress(credentials);

    const fills = range
      ? await this.fetchByTimeRange(walletAddress, range)
      : await this.postInfo<HyperliquidFill[]>({ type: 'userFills', user: walletAddress });

    const mapped = fills.map(mapFill);
    return symbol ? mapped.filter((fill) => fill.symbol === symbol) : mapped;
  }

  /**
   * userFillsByTime returns at most PAGE_LIMIT fills per call, oldest-first
   * within the window. When a page comes back full, the next page starts
   * just after the last fill's own timestamp — otherwise the same fill
   * would be re-fetched forever at the window boundary.
   */
  private async fetchByTimeRange(
    walletAddress: string,
    range: FillsRange,
  ): Promise<HyperliquidFill[]> {
    const fills: HyperliquidFill[] = [];
    let startTime = range.from.getTime();
    const endTime = range.to.getTime();

    for (let page = 0; page < MAX_PAGES && startTime <= endTime; page++) {
      const batch = await this.postInfo<HyperliquidFill[]>({
        type: 'userFillsByTime',
        user: walletAddress,
        startTime,
        endTime,
      });
      if (batch.length === 0) break;

      fills.push(...batch);

      if (batch.length < PAGE_LIMIT) break;
      startTime = Math.max(...batch.map((f) => f.time)) + 1;
    }

    return fills;
  }

  private async postInfo<T>(body: Record<string, unknown>): Promise<T> {
    let response: globalThis.Response;

    try {
      response = await fetch(HYPERLIQUID_INFO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      throw new ServiceUnavailableException('Could not reach Hyperliquid');
    }

    if (!response.ok) {
      const responseBody = await response.text();
      throw new ServiceUnavailableException(
        `Hyperliquid API error (${response.status}): ${responseBody}`,
      );
    }

    return response.json() as Promise<T>;
  }
}

function requireWalletAddress(credentials: ExchangeCredentials): string {
  const walletAddress = credentials.walletAddress;

  if (!walletAddress || !WALLET_ADDRESS_PATTERN.test(walletAddress)) {
    throw new BadRequestException('A valid Hyperliquid wallet address (0x...) is required');
  }

  return walletAddress;
}

function mapFill(fill: HyperliquidFill): NormalizedFill {
  return {
    id: String(fill.tid),
    symbol: fill.coin,
    price: Number(fill.px),
    qty: Number(fill.sz),
    isBuyer: fill.side === 'B' || fill.side === 'Buy',
    time: fill.time,
  };
}
