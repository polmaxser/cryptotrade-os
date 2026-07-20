import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BacktestRun, Prisma } from '@cryptotrade/database';

import { PrismaService } from '@/common/database/prisma.service';
import { BillingService } from '@/modules/billing/billing.service';

import { BacktestRunRepository } from './repositories/backtest-run.repository';
import { BinanceKlinesService } from './binance-klines.service';
import { RunBacktestDto } from './dto/run-backtest.dto';
import { computeSignal, validateTemplateParams } from './templates/signals';
import { simulate } from './simulator';

const DEFAULT_FEE_PERCENT = 0.1;

@Injectable()
export class BacktestsService {
  constructor(
    private readonly runRepository: BacktestRunRepository,
    private readonly klinesService: BinanceKlinesService,
    private readonly billingService: BillingService,
    private readonly prisma: PrismaService,
  ) {}

  async listForUser(userId: string): Promise<BacktestRun[]> {
    await this.billingService.assertCanUseStrategyBuilder(userId);
    return this.runRepository.findAllByUser(userId);
  }

  async getOne(id: string, userId: string): Promise<BacktestRun> {
    await this.billingService.assertCanUseStrategyBuilder(userId);
    return this.getRunOrThrow(id, userId);
  }

  async run(userId: string, dto: RunBacktestDto): Promise<BacktestRun> {
    await this.billingService.assertCanUseStrategyBuilder(userId);

    validateTemplateParams(dto.template, dto.params);

    const from = new Date(dto.from);
    const to = new Date(dto.to);
    if (from >= to) {
      throw new BadRequestException('"from" must be before "to"');
    }

    if (dto.strategyId) {
      await this.assertStrategyOwnership(userId, dto.strategyId);
    }

    const symbol = dto.symbol.trim().toUpperCase();
    const candles = await this.klinesService.fetchCandles(symbol, dto.timeframe, from, to);

    if (candles.length === 0) {
      throw new BadRequestException('No candle data found for this symbol/timeframe/period');
    }

    const signal = computeSignal(dto.template, candles, dto.params);
    const feePercent = dto.feePercent ?? DEFAULT_FEE_PERCENT;
    const result = simulate(candles, signal, dto.startingCapital, feePercent);

    return this.runRepository.create({
      userId,
      template: dto.template,
      symbol,
      timeframe: dto.timeframe,
      periodStart: from,
      periodEnd: to,
      params: dto.params as Prisma.InputJsonValue,
      startingCapital: dto.startingCapital,
      feePercent,
      summary: result.summary as unknown as Prisma.InputJsonValue,
      equityCurve: result.equityCurve as unknown as Prisma.InputJsonValue,
      trades: result.trades as unknown as Prisma.InputJsonValue,
      strategyId: dto.strategyId,
    });
  }

  /** Same direct-Prisma pattern as TradesService.assertStrategyOwnership — avoids a module-import cycle. */
  private async assertStrategyOwnership(userId: string, strategyId: string): Promise<void> {
    const strategy = await this.prisma.strategy.findUnique({ where: { id: strategyId } });

    if (!strategy || strategy.userId !== userId) {
      throw new NotFoundException('Strategy not found');
    }
  }

  private async getRunOrThrow(id: string, userId: string): Promise<BacktestRun> {
    const run = await this.runRepository.findById(id);

    if (!run) {
      throw new NotFoundException('Backtest run not found');
    }

    if (run.userId !== userId) {
      throw new ForbiddenException('You do not have access to this backtest run');
    }

    return run;
  }
}
