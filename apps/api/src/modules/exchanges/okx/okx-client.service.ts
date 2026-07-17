import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';

import { ExchangeClient, ExchangeCredentials, FillsRange } from '../types/exchange-client';
import { NormalizedFill } from '../types/normalized-fill';

const OKX_BASE_URL = 'https://www.okx.com';
const FILLS_LIMIT = '100';
/** Safety cap on before/after-paginated requests so a huge range can't hang the import. */
const MAX_PAGES = 30;

const ALL_INST_TYPES = ['SPOT', 'SWAP', 'FUTURES'] as const;

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
  /** instId is optional on OKX's fills endpoints — omitting it sweeps every instrument of a given instType. */
  readonly supportsAllSymbolsFetch = true;

  async testConnection(credentials: ExchangeCredentials): Promise<void> {
    await this.signedGet('/api/v5/account/config', credentials, {});
  }

  /**
   * /trade/fills only covers the last 3 days but needs no special access;
   * /trade/fills-history covers up to 3 months and is used whenever an
   * explicit range is requested — a trader picking a "period" is exactly
   * the case that needs to reach past 3 days. Both paginate the same way:
   * `after` walks toward older records using the previous page's oldest billId.
   *
   * When `symbol` is given, instType is derived from it as before. Without
   * one, every instType is swept in turn since OKX has no single "all
   * instruments" call — instType itself is a required filter.
   */
  async fetchFills(
    credentials: ExchangeCredentials,
    symbol: string | undefined,
    range?: FillsRange,
  ): Promise<NormalizedFill[]> {
    const instTypes = symbol ? [instTypeForInstId(symbol)] : ALL_INST_TYPES;
    const path = range ? '/api/v5/trade/fills-history' : '/api/v5/trade/fills';

    const fills: NormalizedFill[] = [];

    for (const instType of instTypes) {
      const baseParams: Record<string, string> = { instType, limit: FILLS_LIMIT };
      if (symbol) {
        baseParams.instId = symbol;
      }
      if (range) {
        baseParams.begin = String(range.from.getTime());
        baseParams.end = String(range.to.getTime());
      }

      let after: string | undefined;

      for (let page = 0; page < MAX_PAGES; page++) {
        const params = after ? { ...baseParams, after } : baseParams;
        const batch = await this.signedGet<OkxFill[]>(path, credentials, params);
        if (batch.length === 0) break;

        fills.push(
          ...batch.map((fill) => ({
            id: fill.billId,
            symbol: fill.instId,
            price: Number(fill.px),
            qty: Number(fill.sz),
            isBuyer: fill.side === 'buy',
            time: Number(fill.ts),
          })),
        );

        if (batch.length < Number(FILLS_LIMIT)) break;
        after = batch[batch.length - 1]?.billId;
      }
    }

    return fills;
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
