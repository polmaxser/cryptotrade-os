import { Controller, Get, Query } from '@nestjs/common';

import { BinanceKlinesService } from './binance-klines.service';
import { GetKlinesDto } from './dto/get-klines.dto';

@Controller('market-data')
export class MarketDataController {
  constructor(private readonly binanceKlinesService: BinanceKlinesService) {}

  @Get('klines')
  async getKlines(@Query() query: GetKlinesDto) {
    return this.binanceKlinesService.fetchCandles(
      query.symbol.toUpperCase(),
      query.timeframe,
      new Date(query.from),
      new Date(query.to),
    );
  }
}
