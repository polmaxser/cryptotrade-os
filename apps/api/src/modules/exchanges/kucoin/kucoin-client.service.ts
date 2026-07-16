import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';

import { ExchangeClient, ExchangeCredentials } from '../types/exchange-client';
import { NormalizedFill } from '../types/normalized-fill';

const KUCOIN_BASE_URL = 'https://api.kucoin.com';
const API_KEY_VERSION = '2';
const FILLS_LIMIT = '100';
const SUCCESS_CODE = '200000';
const AUTH_ERROR_CODES = new Set(['400001', '400003', '400004', '400005']);

interface KucoinFill {
  id: string;
  symbol: string;
  price: string;
  size: string;
  side: 'buy' | 'sell';
  createdAt: number;
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
    await this.signedGet('/api/v1/accounts', credentials, {});
  }

  async fetchFills(credentials: ExchangeCredentials, symbol: string): Promise<NormalizedFill[]> {
    const response = await this.signedGet<{ items: KucoinFill[] }>(
      '/api/v1/hf/fills',
      credentials,
      { symbol, limit: FILLS_LIMIT },
    );

    return response.items.map((fill) => ({
      id: fill.id,
      price: Number(fill.price),
      qty: Number(fill.size),
      isBuyer: fill.side === 'buy',
      time: fill.createdAt,
    }));
  }

  private async signedGet<T>(
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
      response = await fetch(`${KUCOIN_BASE_URL}${requestPath}`, {
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
