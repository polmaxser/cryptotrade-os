import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TradeRepository } from './repositories/trade.repository';

@Injectable()
export class TradesService {
  constructor(
    private readonly tradeRepository: TradeRepository,
  ) {}

  async findAll(): Promise<any[]> {
    return this.tradeRepository.findAll();
  }

  async findOne(id: string): Promise<any> {
    const trade = await this.tradeRepository.findById(id);

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    return trade;
  }

  async create(): Promise<any> {
    return this.tradeRepository.create({
      symbol: 'BTCUSDT',
      side: 'LONG',
      strategy: 'Manual',
      entryPrice: 100000,
      quantity: 0.01,
      openedAt: new Date(),
      userId: 'demo-user',
    });
  }

  async remove(id: string): Promise<any> {
    await this.findOne(id);

    return this.tradeRepository.delete(id);
  }
}