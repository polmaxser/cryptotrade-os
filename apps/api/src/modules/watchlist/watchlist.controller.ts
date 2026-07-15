import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

import { WatchlistService } from './watchlist.service';
import { AddWatchlistItemDto } from './dto/add-watchlist-item.dto';
import { SearchCoinsDto } from './dto/search-coins.dto';

@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  async list(@CurrentUser('id') userId: string) {
    return this.watchlistService.listWithPrices(userId);
  }

  @Get('search')
  async search(@Query() query: SearchCoinsDto) {
    return this.watchlistService.searchCoins(query.query);
  }

  @Post()
  async add(@CurrentUser('id') userId: string, @Body() dto: AddWatchlistItemDto) {
    return this.watchlistService.addItem(userId, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.watchlistService.removeItem(id, userId);
    return { success: true };
  }
}
