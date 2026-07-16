import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

import { NftHoldingsService } from './nft-holdings.service';
import { CreateNftHoldingDto } from './dto/create-nft-holding.dto';
import { UpdateNftHoldingDto } from './dto/update-nft-holding.dto';
import { ListNftHoldingsDto } from './dto/list-nft-holdings.dto';

@Controller('nft-holdings')
export class NftHoldingsController {
  constructor(private readonly nftHoldingsService: NftHoldingsService) {}

  @Get()
  async list(@CurrentUser('id') userId: string, @Query() query: ListNftHoldingsDto) {
    return this.nftHoldingsService.listForUser(userId, query.portfolioId);
  }

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateNftHoldingDto) {
    return this.nftHoldingsService.create(userId, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateNftHoldingDto,
  ) {
    return this.nftHoldingsService.update(id, userId, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.nftHoldingsService.remove(id, userId);
    return { success: true };
  }
}
