import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Trade } from '@cryptotrade/database';

import { TradeRepository } from './repositories/trade.repository';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';

import { PortfoliosService } from '@/modules/portfolios/portfolios.service';
import { BillingService } from '@/modules/billing/billing.service';

@Injectable()
export class TradesService {
  constructor(
    private readonly tradeRepository: TradeRepository,
    private readonly portfoliosService: PortfoliosService,
    private readonly billingService: BillingService,
  ) {}

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
    await this.billingService.assertCanCreateTrade(userId);

    const portfolioId = await this.resolvePortfolioId(userId, dto.portfolioId);

    return this.tradeRepository.create({
      ...dto,
      portfolioId,
      userId,
    });
  }

  async update(id: string, userId: string, dto: UpdateTradeDto): Promise<Trade> {
    await this.findOne(id, userId);

    if (dto.portfolioId) {
      await this.portfoliosService.findOne(dto.portfolioId, userId);
    }

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

  private async resolvePortfolioId(
    userId: string,
    requestedPortfolioId?: string,
  ): Promise<string | null> {
    if (requestedPortfolioId) {
      const portfolio = await this.portfoliosService.findOne(requestedPortfolioId, userId);

      return portfolio.id;
    }

    const defaultPortfolio = await this.portfoliosService.getDefaultForUser(userId);

    return defaultPortfolio?.id ?? null;
  }
}
