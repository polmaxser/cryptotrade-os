import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MarketDataService, CoinSearchResult } from '@/modules/market-data/market-data.service';

import { WatchlistItemRepository } from './repositories/watchlist-item.repository';
import { AddWatchlistItemDto } from './dto/add-watchlist-item.dto';
import { WatchlistItemWithPrice } from './types/watchlist-item-with-price';

@Injectable()
export class WatchlistService {
  constructor(
    private readonly watchlistRepository: WatchlistItemRepository,
    private readonly marketDataService: MarketDataService,
  ) {}

  async searchCoins(query: string): Promise<CoinSearchResult[]> {
    return this.marketDataService.searchCoins(query);
  }

  async listWithPrices(userId: string): Promise<WatchlistItemWithPrice[]> {
    const items = await this.watchlistRepository.findAllByUser(userId);

    if (items.length === 0) return [];

    const prices = await this.marketDataService.getPrices(items.map((item) => item.coinId));

    return items.map((item) => {
      const price = prices[item.coinId];
      return {
        ...item,
        price: price?.usd ?? null,
        change24h: price?.usd24hChange ?? null,
      };
    });
  }

  async addItem(userId: string, dto: AddWatchlistItemDto): Promise<WatchlistItemWithPrice> {
    const existing = await this.watchlistRepository.findByCoinId(userId, dto.coinId);

    if (existing) {
      throw new ConflictException('This coin is already on your watchlist');
    }

    const item = await this.watchlistRepository.create({ userId, ...dto });
    const prices = await this.marketDataService.getPrices([item.coinId]);
    const price = prices[item.coinId];

    return { ...item, price: price?.usd ?? null, change24h: price?.usd24hChange ?? null };
  }

  async removeItem(id: string, userId: string): Promise<void> {
    const item = await this.watchlistRepository.findById(id);

    if (!item) {
      throw new NotFoundException('Watchlist item not found');
    }

    if (item.userId !== userId) {
      throw new ForbiddenException('You do not have access to this watchlist item');
    }

    await this.watchlistRepository.delete(id);
  }
}
