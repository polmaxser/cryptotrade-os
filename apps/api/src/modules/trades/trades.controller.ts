import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Trade } from '@cryptotrade/database';

import { TradesService } from './trades.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

@Controller('trades')
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Get()
  async findAll(@CurrentUser('id') userId: string): Promise<Trade[]> {
    return this.tradesService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string): Promise<Trade> {
    return this.tradesService.findOne(id, userId);
  }

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateTradeDto): Promise<Trade> {
    return this.tradesService.create(userId, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateTradeDto,
  ): Promise<Trade> {
    return this.tradesService.update(id, userId, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string): Promise<Trade> {
    return this.tradesService.remove(id, userId);
  }
}
