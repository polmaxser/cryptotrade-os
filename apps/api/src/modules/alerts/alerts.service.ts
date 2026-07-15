import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertDirection, PriceAlert } from '@cryptotrade/database';

import { MarketDataService } from '@/modules/market-data/market-data.service';

import { PriceAlertRepository } from './repositories/price-alert.repository';
import { CreatePriceAlertDto } from './dto/create-price-alert.dto';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly alertRepository: PriceAlertRepository,
    private readonly marketDataService: MarketDataService,
  ) {}

  async listForUser(userId: string): Promise<PriceAlert[]> {
    return this.alertRepository.findAllByUser(userId);
  }

  async create(userId: string, dto: CreatePriceAlertDto): Promise<PriceAlert> {
    return this.alertRepository.create({ userId, ...dto });
  }

  async remove(id: string, userId: string): Promise<void> {
    const alert = await this.alertRepository.findById(id);

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    if (alert.userId !== userId) {
      throw new ForbiddenException('You do not have access to this alert');
    }

    await this.alertRepository.delete(id);
  }

  /**
   * Checks all active alerts against current prices and marks the ones that
   * crossed their threshold as triggered. In-app only for now — no email/push
   * infra exists yet, so a triggered alert just shows up as such next time the
   * user loads the alerts list.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkAlerts(): Promise<void> {
    const activeAlerts = await this.alertRepository.findActive();
    if (activeAlerts.length === 0) return;

    let prices: Record<string, { usd: number }>;
    try {
      prices = await this.marketDataService.getPrices(activeAlerts.map((alert) => alert.coinId));
    } catch (err) {
      this.logger.warn(`Skipping alert check — market data unavailable: ${(err as Error).message}`);
      return;
    }

    for (const alert of activeAlerts) {
      const price = prices[alert.coinId]?.usd;
      if (price === undefined) continue;

      if (this.isTriggered(alert.direction, price, Number(alert.targetPrice))) {
        await this.alertRepository.markTriggered(alert.id);
      }
    }
  }

  private isTriggered(
    direction: AlertDirection,
    currentPrice: number,
    targetPrice: number,
  ): boolean {
    return direction === AlertDirection.ABOVE
      ? currentPrice >= targetPrice
      : currentPrice <= targetPrice;
  }
}
