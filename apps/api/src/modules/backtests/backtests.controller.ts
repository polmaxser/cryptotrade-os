import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

import { BacktestsService } from './backtests.service';
import { RunBacktestDto } from './dto/run-backtest.dto';

@Controller('backtests')
export class BacktestsController {
  constructor(private readonly backtestsService: BacktestsService) {}

  @Get()
  async list(@CurrentUser('id') userId: string) {
    return this.backtestsService.listForUser(userId);
  }

  @Get(':id')
  async getOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.backtestsService.getOne(id, userId);
  }

  @Post('run')
  async run(@CurrentUser('id') userId: string, @Body() dto: RunBacktestDto) {
    return this.backtestsService.run(userId, dto);
  }
}
