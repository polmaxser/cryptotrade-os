import { Controller, Get } from '@nestjs/common';

import { MarketOverviewService } from './market-overview.service';
import { MarketOverviewSnapshotDto } from './types/market-overview-data';

@Controller('market-overview')
export class MarketOverviewController {
  constructor(private readonly marketOverviewService: MarketOverviewService) {}

  @Get()
  async getLatest(): Promise<MarketOverviewSnapshotDto> {
    return this.marketOverviewService.getLatest();
  }
}
