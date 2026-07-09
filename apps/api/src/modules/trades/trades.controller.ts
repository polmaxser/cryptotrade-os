import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { TradesService } from './trades.service';

@Controller('trades')
export class TradesController {
  constructor(
    private readonly tradesService: TradesService,
  ) {}

  @Get()
  async findAll(): Promise<any[]> {
    return this.tradesService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<any> {
    return this.tradesService.findOne(id);
  }

  @Post()
  async create(): Promise<any> {
    return this.tradesService.create();
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ): Promise<any> {
    return this.tradesService.remove(id);
  }
}