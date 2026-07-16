import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

import { DeFiPositionsService } from './defi-positions.service';
import { CreateDeFiPositionDto } from './dto/create-defi-position.dto';
import { UpdateDeFiPositionDto } from './dto/update-defi-position.dto';
import { ListDeFiPositionsDto } from './dto/list-defi-positions.dto';

@Controller('defi-positions')
export class DeFiPositionsController {
  constructor(private readonly defiPositionsService: DeFiPositionsService) {}

  @Get()
  async list(@CurrentUser('id') userId: string, @Query() query: ListDeFiPositionsDto) {
    return this.defiPositionsService.listForUser(userId, query.portfolioId);
  }

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateDeFiPositionDto) {
    return this.defiPositionsService.create(userId, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDeFiPositionDto,
  ) {
    return this.defiPositionsService.update(id, userId, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.defiPositionsService.remove(id, userId);
    return { success: true };
  }
}
