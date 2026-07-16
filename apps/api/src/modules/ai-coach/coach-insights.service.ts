import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CoachInsight,
  CoachInsightPattern,
  CoachInsightStatus,
  Prisma,
} from '@cryptotrade/database';

import { TradeRepository } from '@/modules/trades/repositories/trade.repository';
import { JournalEntryRepository } from '@/modules/journal/repositories/journal-entry.repository';
import { BillingService } from '@/modules/billing/billing.service';
import { SubscriptionRepository } from '@/modules/billing/repositories/subscription.repository';

import { CoachInsightRepository } from './repositories/coach-insight.repository';
import { PatternDetectorService } from './pattern-detector.service';
import { CoachLlmService } from './coach-llm.service';
import { CoachTradeInput } from './types/pattern-detection';

const ANALYSIS_WINDOW_DAYS = 90;
const DISMISS_COOLDOWN_DAYS = 14;

@Injectable()
export class CoachInsightsService {
  private readonly logger = new Logger(CoachInsightsService.name);

  constructor(
    private readonly insightRepository: CoachInsightRepository,
    private readonly tradeRepository: TradeRepository,
    private readonly journalEntryRepository: JournalEntryRepository,
    private readonly patternDetector: PatternDetectorService,
    private readonly coachLlm: CoachLlmService,
    private readonly billingService: BillingService,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async listForUser(userId: string, status?: CoachInsightStatus): Promise<CoachInsight[]> {
    await this.billingService.assertCanUseAiCoach(userId);
    return this.insightRepository.findAllByUser(userId, status);
  }

  async updateStatus(
    id: string,
    userId: string,
    status: typeof CoachInsightStatus.CONFIRMED | typeof CoachInsightStatus.DISMISSED,
  ): Promise<CoachInsight> {
    await this.billingService.assertCanUseAiCoach(userId);
    const insight = await this.getInsightOrThrow(id, userId);
    return this.insightRepository.updateStatus(insight.id, status);
  }

  /**
   * User-triggered re-run of the same detection the nightly cron does — a pull,
   * not a notification, so it doesn't conflict with the "not a noisy stream" rule.
   */
  async analyzeNow(userId: string): Promise<CoachInsight[]> {
    await this.billingService.assertCanUseAiCoach(userId);

    if (!this.coachLlm.isConfigured) {
      throw new ServiceUnavailableException(
        'AI Coach is not configured yet — no Anthropic API key is set',
      );
    }

    return this.runDetectionForUser(userId);
  }

  /** Runs detection for every non-lapsed Premium user. Failures are per-user and don't abort the batch. */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async runDailyDetection(): Promise<void> {
    if (!this.coachLlm.isConfigured) {
      this.logger.warn('Skipping AI Coach daily run — Anthropic API key is not configured');
      return;
    }

    const userIds = await this.subscriptionRepository.findActivePremiumUserIds();

    for (const userId of userIds) {
      try {
        await this.runDetectionForUser(userId);
      } catch (err) {
        this.logger.warn(`AI Coach detection failed for user ${userId}: ${(err as Error).message}`);
      }
    }
  }

  private async runDetectionForUser(userId: string): Promise<CoachInsight[]> {
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - ANALYSIS_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const [trades, journalRows] = await Promise.all([
      this.tradeRepository.findForCoachAnalysis(userId, periodStart, periodEnd),
      this.journalEntryRepository.findLinkedForCoachAnalysis(userId, periodStart, periodEnd),
    ]);

    const tradeInputs: CoachTradeInput[] = trades.map((t) => ({
      id: t.id,
      symbol: t.symbol,
      side: t.side,
      quantity: Number(t.quantity),
      entryPrice: Number(t.entryPrice),
      pnl: t.pnl !== null ? Number(t.pnl) : null,
      status: t.status,
      openedAt: t.openedAt,
      closedAt: t.closedAt,
    }));

    const findings = this.patternDetector.detectAll(tradeInputs, journalRows);
    const created: CoachInsight[] = [];

    for (const finding of findings) {
      const shouldCreate = await this.shouldCreateInsight(userId, finding.pattern);
      if (!shouldCreate) continue;

      const text = await this.coachLlm.phraseFinding(finding);

      const insight = await this.insightRepository.create({
        userId,
        pattern: finding.pattern,
        title: text.title,
        description: text.description,
        metrics: finding.metrics as Prisma.InputJsonValue,
        relatedTradeIds: finding.relatedTradeIds,
        periodStart,
        periodEnd,
      });

      created.push(insight);
    }

    return created;
  }

  /** Skips a pattern already open (NEW/CONFIRMED), and respects a cooldown after the trader dismisses it. */
  private async shouldCreateInsight(
    userId: string,
    pattern: CoachInsightPattern,
  ): Promise<boolean> {
    const mostRecent = await this.insightRepository.findMostRecentByUserAndPattern(userId, pattern);
    if (!mostRecent) return true;

    if (mostRecent.status !== CoachInsightStatus.DISMISSED) {
      return false;
    }

    const cooldownMs = DISMISS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    const reviewedAt = mostRecent.reviewedAt ?? mostRecent.createdAt;
    return Date.now() - reviewedAt.getTime() > cooldownMs;
  }

  private async getInsightOrThrow(id: string, userId: string): Promise<CoachInsight> {
    const insight = await this.insightRepository.findById(id);

    if (!insight) {
      throw new NotFoundException('Insight not found');
    }

    if (insight.userId !== userId) {
      throw new ForbiddenException('You do not have access to this insight');
    }

    return insight;
  }
}
