import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

import { StrategiesService } from './strategies.service';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';

@Controller('strategies')
export class StrategiesController {
  constructor(private readonly strategiesService: StrategiesService) {}

  @Get()
  async list(@CurrentUser('id') userId: string) {
    return this.strategiesService.listForUser(userId);
  }

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateStrategyDto) {
    return this.strategiesService.create(userId, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStrategyDto,
  ) {
    return this.strategiesService.update(id, userId, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.strategiesService.remove(id, userId);
    return { success: true };
  }

  @Get(':id/performance')
  async getPerformance(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.strategiesService.getPerformance(id, userId);
  }
}
