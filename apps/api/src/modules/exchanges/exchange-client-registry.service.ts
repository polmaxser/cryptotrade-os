import { Injectable } from '@nestjs/common';
import { ExchangeProvider } from '@cryptotrade/database';

import { BinanceClientService } from './binance/binance-client.service';
import { BybitClientService } from './bybit/bybit-client.service';
import { OkxClientService } from './okx/okx-client.service';
import { KucoinClientService } from './kucoin/kucoin-client.service';
import { GateioClientService } from './gateio/gateio-client.service';
import { HyperliquidClientService } from './hyperliquid/hyperliquid-client.service';
import { ExchangeClient } from './types/exchange-client';

@Injectable()
export class ExchangeClientRegistry {
  private readonly clients: Record<ExchangeProvider, ExchangeClient>;

  constructor(
    binanceClient: BinanceClientService,
    bybitClient: BybitClientService,
    okxClient: OkxClientService,
    kucoinClient: KucoinClientService,
    gateioClient: GateioClientService,
    hyperliquidClient: HyperliquidClientService,
  ) {
    this.clients = {
      [ExchangeProvider.BINANCE]: binanceClient,
      [ExchangeProvider.BYBIT]: bybitClient,
      [ExchangeProvider.OKX]: okxClient,
      [ExchangeProvider.KUCOIN]: kucoinClient,
      [ExchangeProvider.GATEIO]: gateioClient,
      [ExchangeProvider.HYPERLIQUID]: hyperliquidClient,
    };
  }

  getClient(provider: ExchangeProvider): ExchangeClient {
    return this.clients[provider];
  }
}
