import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';

import { ExchangeClient, ExchangeCredentials } from '../types/exchange-client';
import { NormalizedFill } from '../types/normalized-fill';

const OKX_BASE_URL = 'https://www.okx.com';
const FILLS_LIMIT = '100';

interface OkxFill {
  billId: string;
  instId: string;
  px: string;
  sz: string;
  side: 'buy' | 'sell';
  ts: string;
}

interface OkxResponse<T> {
  code: string;
  msg: string;
  data: T;
}

/**
 * Thin, read-only wrapper over OKX's V5 signed REST API. Only ever calls
 * account-read and fill-history endpoints — never order placement or
 * withdrawal. Unlike Binance/Bybit, OKX requires a third credential (a
 * passphrase set at API key creation) on every signed request.
 *
 * OKX's public docs don't clearly enumerate which `code` values specifically
 * mean "bad credentials" vs. other request errors, so unlike Bybit's client
 * this only classifies a failure as Unauthorized when the HTTP status itself
 * is 401/403; any other non-"0" code surfaces OKX's own message via a 503
 * rather than guessing at a stricter classification.
 */
@Injectable()
export class OkxClientService implements ExchangeClient {
  async testConnection(credentials: ExchangeCredentials): Promise<void> {
    await this.signedGet('/api/v5/account/config', credentials, {});
  }

  async fetchFills(credentials: ExchangeCredentials, symbol: string): Promise<NormalizedFill[]> {
    const fills = await this.signedGet<OkxFill[]>('/api/v5/trade/fills', credentials, {
      instType: instTypeForInstId(symbol),
      instId: symbol,
      limit: FILLS_LIMIT,
    });

    return fills.map((fill) => ({
      id: fill.billId,
      price: Number(fill.px),
      qty: Number(fill.sz),
      isBuyer: fill.side === 'buy',
      time: Number(fill.ts),
    }));
  }

  private async signedGet<T>(
    path: string,
    credentials: ExchangeCredentials,
    params: Record<string, string>,
  ): Promise<T> {
    if (!credentials.apiPassphrase) {
      throw new UnauthorizedException('OKX requires an API passphrase in addition to key/secret');
    }

    const query = new URLSearchParams(params);
    const queryString = query.toString();
    const requestPath = `${path}${queryString ? `?${queryString}` : ''}`;
    const timestamp = new Date().toISOString();

    const signaturePayload = `${timestamp}GET${requestPath}`;
    const signature = createHmac('sha256', credentials.apiSecret)
      .update(signaturePayload)
      .digest('base64');

    let response: globalThis.Response;

    try {
      response = await fetch(`${OKX_BASE_URL}${requestPath}`, {
        headers: {
          'OK-ACCESS-KEY': credentials.apiKey,
          'OK-ACCESS-SIGN': signature,
          'OK-ACCESS-TIMESTAMP': timestamp,
          'OK-ACCESS-PASSPHRASE': credentials.apiPassphrase,
        },
      });
    } catch {
      throw new ServiceUnavailableException('Could not reach OKX');
    }

    if (response.status === 401 || response.status === 403) {
      throw new UnauthorizedException('OKX rejected these API credentials');
    }

    if (!response.ok) {
      const body = await response.text();
      throw new ServiceUnavailableException(`OKX API error (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as OkxResponse<T>;

    if (payload.code !== '0') {
      throw new ServiceUnavailableException(`OKX API error (${payload.code}): ${payload.msg}`);
    }

    return payload.data;
  }
}

/**
 * Unlike Bybit/Binance, OKX bakes the market type into the instId itself, so the
 * right instType can be derived rather than asked for: "HYPE-USDT" is spot,
 * "HYPE-USDT-SWAP" is a perpetual, and "BTC-USD-260717" (a YYMMDD suffix) is a
 * dated future. Confirmed against OKX's public instruments endpoint.
 */
function instTypeForInstId(instId: string): 'SPOT' | 'SWAP' | 'FUTURES' {
  if (instId.endsWith('-SWAP')) return 'SWAP';
  if (/-\d{6}$/.test(instId)) return 'FUTURES';
  return 'SPOT';
}
