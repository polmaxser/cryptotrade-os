import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';

import { ExchangeClient, ExchangeCredentials } from '../types/exchange-client';
import { NormalizedFill } from '../types/normalized-fill';

const KUCOIN_SPOT_BASE_URL = 'https://api.kucoin.com';
/** Futures live on a separate host with their own symbol namespace (e.g. spot "BTC-USDT" vs futures "XBTUSDTM"). */
const KUCOIN_FUTURES_BASE_URL = 'https://api-futures.kucoin.com';
const API_KEY_VERSION = '2';
const FILLS_LIMIT = '100';
const SUCCESS_CODE = '200000';
const AUTH_ERROR_CODES = new Set(['400001', '400003', '400004', '400005']);

interface KucoinSpotFill {
  id: string;
  symbol: string;
  price: string;
  size: string;
  side: 'buy' | 'sell';
  createdAt: number;
}

/** Same shape as the spot fill, except the id field is `tradeId` and the timestamp is in nanoseconds. */
interface KucoinFuturesFill {
  tradeId: string;
  symbol: string;
  price: string;
  size: string;
  side: 'buy' | 'sell';
  tradeTime: number;
}

interface KucoinResponse<T> {
  code: string;
  msg?: string;
  data: T;
}

/**
 * Thin, read-only wrapper over KuCoin's signed REST API. Only ever calls
 * account-read and fill-history endpoints — never order placement or
 * withdrawal. KuCoin requires a passphrase like OKX, but — unlike OKX —
 * the passphrase itself must be HMAC-SHA256-signed with the API secret
 * (not sent in plaintext), and every request needs a KC-API-KEY-VERSION
 * header (2, for current-generation API keys).
 */
@Injectable()
export class KucoinClientService implements ExchangeClient {
  async testConnection(credentials: ExchangeCredentials): Promise<void> {
    await this.signedGet(KUCOIN_SPOT_BASE_URL, '/api/v1/accounts', credentials, {});
  }

  /**
   * Spot and futures are entirely separate symbol namespaces on KuCoin (spot
   * "BTC-USDT" vs futures "XBTUSDTM"), unlike Binance/Bybit where the same
   * string spans both. Querying the wrong market for a given symbol just
   * returns an empty list, so it's safe to query both hosts and merge —
   * whichever one actually matches the symbol contributes fills.
   */
  async fetchFills(credentials: ExchangeCredentials, symbol: string): Promise<NormalizedFill[]> {
    const [spotResult, futuresResult] = await Promise.allSettled([
      this.signedGet<{ items: KucoinSpotFill[] }>(
        KUCOIN_SPOT_BASE_URL,
        '/api/v1/hf/fills',
        credentials,
        { symbol, limit: FILLS_LIMIT },
      ),
      this.signedGet<{ items: KucoinFuturesFill[] }>(
        KUCOIN_FUTURES_BASE_URL,
        '/api/v1/fills',
        credentials,
        { symbol },
      ),
    ]);

    const spotFills: NormalizedFill[] =
      spotResult.status === 'fulfilled'
        ? spotResult.value.items.map((fill) => ({
            id: `spot:${fill.id}`,
            price: Number(fill.price),
            qty: Number(fill.size),
            isBuyer: fill.side === 'buy',
            time: fill.createdAt,
          }))
        : [];

    const futuresFills: NormalizedFill[] =
      futuresResult.status === 'fulfilled'
        ? futuresResult.value.items.map((fill) => ({
            id: `futures:${fill.tradeId}`,
            price: Number(fill.price),
            qty: Number(fill.size),
            isBuyer: fill.side === 'buy',
            time: Math.floor(fill.tradeTime / 1_000_000),
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
    if (!credentials.apiPassphrase) {
      throw new UnauthorizedException(
        'KuCoin requires an API passphrase in addition to key/secret',
      );
    }

    const query = new URLSearchParams(params);
    const queryString = query.toString();
    const requestPath = `${path}${queryString ? `?${queryString}` : ''}`;
    const timestamp = Date.now().toString();

    const signaturePayload = `${timestamp}GET${requestPath}`;
    const signature = createHmac('sha256', credentials.apiSecret)
      .update(signaturePayload)
      .digest('base64');

    const encryptedPassphrase = createHmac('sha256', credentials.apiSecret)
      .update(credentials.apiPassphrase)
      .digest('base64');

    let response: globalThis.Response;

    try {
      response = await fetch(`${baseUrl}${requestPath}`, {
        headers: {
          'KC-API-KEY': credentials.apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp,
          'KC-API-PASSPHRASE': encryptedPassphrase,
          'KC-API-KEY-VERSION': API_KEY_VERSION,
        },
      });
    } catch {
      throw new ServiceUnavailableException('Could not reach KuCoin');
    }

    if (response.status === 401 || response.status === 403) {
      throw new UnauthorizedException('KuCoin rejected these API credentials');
    }

    if (!response.ok) {
      const body = await response.text();
      throw new ServiceUnavailableException(`KuCoin API error (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as KucoinResponse<T>;

    if (payload.code !== SUCCESS_CODE) {
      if (AUTH_ERROR_CODES.has(payload.code)) {
        throw new UnauthorizedException('KuCoin rejected these API credentials');
      }

      throw new ServiceUnavailableException(
        `KuCoin API error (${payload.code}): ${payload.msg ?? 'unknown error'}`,
      );
    }

    return payload.data;
  }
}
