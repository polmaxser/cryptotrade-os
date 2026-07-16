import { Injectable } from '@nestjs/common';
import { ExchangeProvider } from '@cryptotrade/database';

import { BinanceClientService } from './binance/binance-client.service';
import { BybitClientService } from './bybit/bybit-client.service';
import { OkxClientService } from './okx/okx-client.service';
import { ExchangeClient } from './types/exchange-client';

@Injectable()
export class ExchangeClientRegistry {
  private readonly clients: Record<ExchangeProvider, ExchangeClient>;

  constructor(
    binanceClient: BinanceClientService,
    bybitClient: BybitClientService,
    okxClient: OkxClientService,
  ) {
    this.clients = {
      [ExchangeProvider.BINANCE]: binanceClient,
      [ExchangeProvider.BYBIT]: bybitClient,
      [ExchangeProvider.OKX]: okxClient,
    };
  }

  getClient(provider: ExchangeProvider): ExchangeClient {
    return this.clients[provider];
  }
}
