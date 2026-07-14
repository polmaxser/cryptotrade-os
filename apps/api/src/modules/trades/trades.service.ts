import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { type Trade } from '@cryptotrade/database';

import { type TradeRepository } from './repositories/trade.repository';
import { type CreateTradeDto } from './dto/create-trade.dto';
import { type UpdateTradeDto } from './dto/update-trade.dto';

@Injectable()
export class TradesService {
  constructor(private readonly tradeRepository: TradeRepository) {}

  async findAll(userId: string): Promise<Trade[]> {
    return this.tradeRepository.findAllByUser(userId);
  }

  async findOne(id: string, userId: string): Promise<Trade> {
    const trade = await this.tradeRepository.findById(id);

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    this.assertOwnership(trade, userId);

    return trade;
  }

  async create(userId: string, dto: CreateTradeDto): Promise<Trade> {
    return this.tradeRepository.create({
      ...dto,
      userId,
    });
  }

  async update(id: string, userId: string, dto: UpdateTradeDto): Promise<Trade> {
    await this.findOne(id, userId);

    return this.tradeRepository.update(id, dto);
  }

  async remove(id: string, userId: string): Promise<Trade> {
    await this.findOne(id, userId);

    return this.tradeRepository.delete(id);
  }

  private assertOwnership(trade: Trade, userId: string): void {
    if (trade.userId !== userId) {
      throw new ForbiddenException('You do not have access to this trade');
    }
  }
}
