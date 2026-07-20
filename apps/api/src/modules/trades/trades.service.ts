import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Trade } from '@cryptotrade/database';

import { TradeRepository } from './repositories/trade.repository';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';

import { PrismaService } from '@/common/database/prisma.service';
import { PortfoliosService } from '@/modules/portfolios/portfolios.service';
import { BillingService } from '@/modules/billing/billing.service';

@Injectable()
export class TradesService {
  constructor(
    private readonly tradeRepository: TradeRepository,
    private readonly portfoliosService: PortfoliosService,
    private readonly billingService: BillingService,
    private readonly prisma: PrismaService,
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

    const portfolioId = await this.portfoliosService.resolvePortfolioId(userId, dto.portfolioId);

    if (dto.strategyId) {
      await this.assertStrategyOwnership(userId, dto.strategyId);
    }

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

    if (dto.strategyId) {
      await this.assertStrategyOwnership(userId, dto.strategyId);
    }

    return this.tradeRepository.update(id, dto);
  }

  /**
   * Checked directly via Prisma rather than injecting StrategiesService —
   * StrategiesModule needs AnalyticsModule (for per-strategy performance),
   * which itself needs TradesModule, so TradesModule importing
   * StrategiesModule would create a cycle. A trade's own userId already
   * scopes every analytics query, so this check is about data integrity
   * (not silently attaching a trade to someone else's strategy), not a
   * cross-tenant leak.
   */
  private async assertStrategyOwnership(userId: string, strategyId: string): Promise<void> {
    const strategy = await this.prisma.strategy.findUnique({ where: { id: strategyId } });

    if (!strategy || strategy.userId !== userId) {
      throw new NotFoundException('Strategy not found');
    }
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
