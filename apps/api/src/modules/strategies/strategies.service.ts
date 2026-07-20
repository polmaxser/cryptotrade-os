import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Strategy } from '@cryptotrade/database';

import { AnalyticsService } from '@/modules/analytics/analytics.service';
import { AnalyticsSummary } from '@/modules/analytics/types/analytics-summary';
import { BillingService } from '@/modules/billing/billing.service';

import { StrategyRepository } from './repositories/strategy.repository';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';

@Injectable()
export class StrategiesService {
  constructor(
    private readonly strategyRepository: StrategyRepository,
    private readonly analyticsService: AnalyticsService,
    private readonly billingService: BillingService,
  ) {}

  async listForUser(userId: string): Promise<Strategy[]> {
    await this.billingService.assertCanUseStrategyBuilder(userId);
    return this.strategyRepository.findAllByUser(userId);
  }

  async create(userId: string, dto: CreateStrategyDto): Promise<Strategy> {
    await this.billingService.assertCanUseStrategyBuilder(userId);

    const name = dto.name.trim();
    const existing = await this.strategyRepository.findByName(userId, name);
    if (existing) {
      throw new ConflictException('You already have a strategy with this name');
    }

    return this.strategyRepository.create({ ...dto, name, userId });
  }

  async update(id: string, userId: string, dto: UpdateStrategyDto): Promise<Strategy> {
    await this.billingService.assertCanUseStrategyBuilder(userId);
    const strategy = await this.getStrategyOrThrow(id, userId);

    if (dto.name) {
      const name = dto.name.trim();
      const existing = await this.strategyRepository.findByName(userId, name);
      if (existing && existing.id !== strategy.id) {
        throw new ConflictException('You already have a strategy with this name');
      }
    }

    return this.strategyRepository.update(id, dto);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.billingService.assertCanUseStrategyBuilder(userId);
    await this.getStrategyOrThrow(id, userId);
    await this.strategyRepository.delete(id);
  }

  /** Win rate / PnL / expectancy etc. for trades linked to this strategy — reuses AnalyticsService rather than recomputing. */
  async getPerformance(id: string, userId: string): Promise<AnalyticsSummary> {
    await this.billingService.assertCanUseStrategyBuilder(userId);
    await this.getStrategyOrThrow(id, userId);

    return this.analyticsService.getSummary(userId, undefined, undefined, id);
  }

  private async getStrategyOrThrow(id: string, userId: string): Promise<Strategy> {
    const strategy = await this.strategyRepository.findById(id);

    if (!strategy) {
      throw new NotFoundException('Strategy not found');
    }

    if (strategy.userId !== userId) {
      throw new ForbiddenException('You do not have access to this strategy');
    }

    return strategy;
  }
}
