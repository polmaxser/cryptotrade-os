import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Trade } from '@cryptotrade/database';

import { TradeRepository } from './repositories/trade.repository';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { ListTradesDto } from './dto/list-trades.dto';

import { PrismaService } from '@/common/database/prisma.service';
import { Paginated } from '@/common/types/paginated';
import { PortfoliosService } from '@/modules/portfolios/portfolios.service';
import { BillingService } from '@/modules/billing/billing.service';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

@Injectable()
export class TradesService {
  constructor(
    private readonly tradeRepository: TradeRepository,
    private readonly portfoliosService: PortfoliosService,
    private readonly billingService: BillingService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(userId: string, query: ListTradesDto): Promise<Paginated<Trade>> {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.tradeRepository.findAllByUser(userId, skip, pageSize),
      this.tradeRepository.countByUser(userId),
    ]);

    return { items, total, page, pageSize };
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
