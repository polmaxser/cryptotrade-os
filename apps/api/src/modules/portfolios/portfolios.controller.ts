import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Portfolio } from '@cryptotrade/database';

import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { PortfolioWithTradeCount } from './repositories/portfolio.repository';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Get()
  async findAll(@CurrentUser('id') userId: string): Promise<PortfolioWithTradeCount[]> {
    return this.portfoliosService.findAll(userId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<PortfolioWithTradeCount> {
    return this.portfoliosService.findOne(id, userId);
  }

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePortfolioDto,
  ): Promise<Portfolio> {
    return this.portfoliosService.create(userId, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePortfolioDto,
  ): Promise<Portfolio> {
    return this.portfoliosService.update(id, userId, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string): Promise<Portfolio> {
    return this.portfoliosService.remove(id, userId);
  }
}
