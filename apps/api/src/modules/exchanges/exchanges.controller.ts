import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

import { ExchangesService } from './exchanges.service';
import { CreateExchangeConnectionDto } from './dto/create-exchange-connection.dto';
import { ImportTradesDto } from './dto/import-trades.dto';

@Controller('exchanges/connections')
export class ExchangesController {
  constructor(private readonly exchangesService: ExchangesService) {}

  @Get()
  async list(@CurrentUser('id') userId: string) {
    return this.exchangesService.listConnections(userId);
  }

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateExchangeConnectionDto) {
    return this.exchangesService.createConnection(userId, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.exchangesService.deleteConnection(id, userId);
    return { success: true };
  }

  @Post(':id/import')
  async import(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ImportTradesDto,
  ) {
    return this.exchangesService.importTrades(id, userId, dto);
  }

  @Get(':id/balance')
  async balance(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.exchangesService.getBalance(id, userId);
  }
}
