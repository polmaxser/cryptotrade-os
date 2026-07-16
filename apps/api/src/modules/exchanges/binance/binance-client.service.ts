import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';

import { ExchangeClient, ExchangeCredentials } from '../types/exchange-client';
import { NormalizedFill } from '../types/normalized-fill';

const BINANCE_SPOT_BASE_URL = 'https://api.binance.com';
/** USDⓈ-M futures live on an entirely separate host from spot, with their own endpoint — same HMAC scheme though. */
const BINANCE_FUTURES_BASE_URL = 'https://fapi.binance.com';
const RECV_WINDOW_MS = '10000';

interface BinanceSpotFill {
  symbol: string;
  id: number;
  orderId: number;
  price: string;
  qty: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  isMaker: boolean;
}

/** Same shape as the spot fill, except the buyer flag is named `buyer` instead of `isBuyer`. */
interface BinanceFuturesFill {
  symbol: string;
  id: number;
  orderId: number;
  price: string;
  qty: string;
  time: number;
  buyer: boolean;
}

/**
 * Thin, read-only wrapper over Binance's signed REST API. Only ever calls
 * account-read and trade-history endpoints — never order placement or
 * withdrawal, by design, since this feature only imports history.
 */
@Injectable()
export class BinanceClientService implements ExchangeClient {
  async testConnection(credentials: ExchangeCredentials): Promise<void> {
    await this.signedGet(BINANCE_SPOT_BASE_URL, '/api/v3/account', credentials, {});
  }

  /**
   * Spot and USDⓈ-M futures are separate accounts with separate trade logs on
   * Binance — a symbol like BTCUSDT can have history on either or both. We
   * query both and merge, prefixing ids by market since each is its own
   * sequential id space and could otherwise collide across the two. If
   * futures isn't enabled on the account, that call fails and spot alone is
   * returned rather than failing the whole import.
   */
  async fetchFills(credentials: ExchangeCredentials, symbol: string): Promise<NormalizedFill[]> {
    const [spotResult, futuresResult] = await Promise.allSettled([
      this.signedGet<BinanceSpotFill[]>(BINANCE_SPOT_BASE_URL, '/api/v3/myTrades', credentials, {
        symbol,
        limit: '1000',
      }),
      this.signedGet<BinanceFuturesFill[]>(
        BINANCE_FUTURES_BASE_URL,
        '/fapi/v1/userTrades',
        credentials,
        { symbol, limit: '1000' },
      ),
    ]);

    const spotFills: NormalizedFill[] =
      spotResult.status === 'fulfilled'
        ? spotResult.value.map((fill) => ({
            id: `spot:${fill.id}`,
            price: Number(fill.price),
            qty: Number(fill.qty),
            isBuyer: fill.isBuyer,
            time: fill.time,
          }))
        : [];

    const futuresFills: NormalizedFill[] =
      futuresResult.status === 'fulfilled'
        ? futuresResult.value.map((fill) => ({
            id: `futures:${fill.id}`,
            price: Number(fill.price),
            qty: Number(fill.qty),
            isBuyer: fill.buyer,
            time: fill.time,
          }))
        : [];

    if (spotResult.status === 'rejected' && futuresResult.status === 'rejected') {
      throw spotResult.reason;
    }

    return [...spotFills, ...futuresFills];
  }

  private async signedGet<T>(
    baseUrl: string,
    path: string,
    credentials: ExchangeCredentials,
    params: Record<string, string>,
  ): Promise<T> {
    const query = new URLSearchParams({
      ...params,
      timestamp: Date.now().toString(),
      recvWindow: RECV_WINDOW_MS,
    });
    const signature = createHmac('sha256', credentials.apiSecret)
      .update(query.toString())
      .digest('hex');
    query.set('signature', signature);

    let response: globalThis.Response;

    try {
      response = await fetch(`${baseUrl}${path}?${query.toString()}`, {
        headers: { 'X-MBX-APIKEY': credentials.apiKey },
      });
    } catch {
      throw new ServiceUnavailableException('Could not reach Binance');
    }

    if (response.status === 401 || response.status === 403) {
      throw new UnauthorizedException('Binance rejected these API credentials');
    }

    if (!response.ok) {
      const body = await response.text();
      throw new ServiceUnavailableException(`Binance API error (${response.status}): ${body}`);
    }

    return response.json() as Promise<T>;
  }
}
