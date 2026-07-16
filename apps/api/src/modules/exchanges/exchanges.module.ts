import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/common/database/database.module';
import { CryptoModule } from '@/common/crypto/crypto.module';
import { TradesModule } from '@/modules/trades/trades.module';
import { PortfoliosModule } from '@/modules/portfolios/portfolios.module';
import { BillingModule } from '@/modules/billing/billing.module';

import { ExchangesController } from './exchanges.controller';
import { ExchangesService } from './exchanges.service';
import { ExchangeClientRegistry } from './exchange-client-registry.service';
import { ExchangeConnectionRepository } from './repositories/exchange-connection.repository';
import { BinanceClientService } from './binance/binance-client.service';
import { BybitClientService } from './bybit/bybit-client.service';
import { OkxClientService } from './okx/okx-client.service';

@Module({
  imports: [DatabaseModule, CryptoModule, TradesModule, PortfoliosModule, BillingModule],

  controllers: [ExchangesController],

  providers: [
    ExchangesService,
    ExchangeConnectionRepository,
    ExchangeClientRegistry,
    BinanceClientService,
    BybitClientService,
    OkxClientService,
  ],

  exports: [ExchangesService],
})
export class ExchangesModule {}
