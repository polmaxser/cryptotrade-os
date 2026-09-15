import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AiReport, AiReportType, Prisma } from '@cryptotrade/database';

import { AnalyticsService } from '@/modules/analytics/analytics.service';
import { AnalyticsSummary } from '@/modules/analytics/types/analytics-summary';
import { CoachInsightRepository } from '@/modules/ai-coach/repositories/coach-insight.repository';
import { BillingService } from '@/modules/billing/billing.service';
import { SubscriptionRepository } from '@/modules/billing/repositories/subscription.repository';

import { AiReportRepository } from './repositories/ai-report.repository';
import { ReportLlmService } from './report-llm.service';
import {
  ReportPeriod,
  dailyPeriod,
  monthlyPeriod,
  previousPeriod,
  weeklyPeriod,
} from './types/report-period';
import {
  REPORT_GENERATION_JOB,
  REPORT_GENERATION_QUEUE,
  ReportGenerationJobData,
} from './report-generation.types';
import { ReportQueueEventsListener } from './report-queue-events.listener';

const GENERATE_NOW_TIMEOUT_MS = 60_000;

const PERIOD_BUILDERS: Record<AiReportType, (reference: Date) => ReportPeriod> = {
  DAILY: dailyPeriod,
  WEEKLY: weeklyPeriod,
  MONTHLY: monthlyPeriod,
};

/** DAILY is just "today's PnL + notable finding" per docs/ai_coach.md — no prior-period comparison. */
const COMPARES_TO_PREVIOUS: Record<AiReportType, boolean> = {
  DAILY: false,
  WEEKLY: true,
  MONTHLY: true,
};

@Injectable()
export class AiReportsService {
  private readonly logger = new Logger(AiReportsService.name);

  constructor(
    private readonly reportRepository: AiReportRepository,
    private readonly analyticsService: AnalyticsService,
    private readonly coachInsightRepository: CoachInsightRepository,
    private readonly reportLlm: ReportLlmService,
    private readonly billingService: BillingService,
    private readonly subscriptionRepository: SubscriptionRepository,
    @InjectQueue(REPORT_GENERATION_QUEUE)
    private readonly reportQueue: Queue<ReportGenerationJobData>,
    private readonly queueEvents: ReportQueueEventsListener,
  ) {}

  async listForUser(userId: string, type?: AiReportType): Promise<AiReport[]> {
    await this.billingService.assertCanUseAiReports(userId);
    return this.reportRepository.findAllByUser(userId, type);
  }

  async getOne(id: string, userId: string): Promise<AiReport> {
    await this.billingService.assertCanUseAiReports(userId);
    return this.getReportOrThrow(id, userId);
  }

  /**
   * User-triggered generation for the *current, still in-progress* period —
   * "generate now" reads as "summarize today/this week/this month so far",
   * unlike the cron runs below which always cover a period that just ended.
   *
   * Routed through the same queue as the cron so both share one worker's
   * concurrency limit on Anthropic calls; waits for the job so the response
   * contract stays synchronous for the frontend.
   */
  async generateNow(userId: string, type: AiReportType): Promise<AiReport> {
    await this.billingService.assertCanUseAiReports(userId);

    if (!this.reportLlm.isConfigured) {
      throw new ServiceUnavailableException(
        'AI Reports is not configured yet — no Anthropic API key is set',
      );
    }

    const job = await this.reportQueue.add(
      REPORT_GENERATION_JOB,
      { userId, type, reference: new Date().toISOString() },
      { removeOnComplete: true, removeOnFail: 100 },
    );

    return job.waitUntilFinished(this.queueEvents.queueEvents, GENERATE_NOW_TIMEOUT_MS);
  }

  /** Runs after AI Coach's 1am detection so the day's findings are already in place. */
  @Cron('0 2 * * *')
  async runDailyReports(): Promise<void> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.runForAllPremiumUsers('DAILY', yesterday);
  }

  @Cron('30 2 * * 1')
  async runWeeklyReports(): Promise<void> {
    const lastWeekReference = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await this.runForAllPremiumUsers('WEEKLY', lastWeekReference);
  }

  @Cron('0 3 1 * *')
  async runMonthlyReports(): Promise<void> {
    const lastMonthReference = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.runForAllPremiumUsers('MONTHLY', lastMonthReference);
  }

  /**
   * Enqueues one job per user instead of generating reports in-process —
   * same rationale as CoachInsightsService.runDailyDetection: a sequential
   * loop of synchronous Anthropic calls would hold the cron open for as long
   * as the whole Premium user base takes, with no retry on failure.
   */
  private async runForAllPremiumUsers(type: AiReportType, reference: Date): Promise<void> {
    if (!this.reportLlm.isConfigured) {
      this.logger.warn(`Skipping ${type} AI Reports run — Anthropic API key is not configured`);
      return;
    }

    const userIds = await this.subscriptionRepository.findActivePremiumUserIds();

    for (const userId of userIds) {
      await this.reportQueue.add(
        REPORT_GENERATION_JOB,
        { userId, type, reference: reference.toISOString() },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 30_000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
    }
  }

  /** Idempotent per (userId, type, periodStart) — a repeat call for an already-covered period returns the existing row. */
  async generateForPeriod(userId: string, type: AiReportType, reference: Date): Promise<AiReport> {
    const period = PERIOD_BUILDERS[type](reference);

    const existing = await this.reportRepository.findByUserTypeAndPeriodStart(
      userId,
      type,
      period.from,
    );
    if (existing) {
      return existing;
    }

    const metrics = await this.analyticsService.getSummary(userId, undefined, period);

    let previousMetrics: AnalyticsSummary | undefined;
    if (type !== 'DAILY' && COMPARES_TO_PREVIOUS[type]) {
      previousMetrics = await this.analyticsService.getSummary(
        userId,
        undefined,
        previousPeriod(type, period),
      );
    }

    const findings = await this.coachInsightRepository.findCreatedInRange(
      userId,
      period.from,
      period.to,
    );
    const patternCounts: Record<string, number> = {};
    for (const finding of findings) {
      patternCounts[finding.pattern] = (patternCounts[finding.pattern] ?? 0) + 1;
    }

    const text = await this.reportLlm.phraseReport({
      type,
      periodStart: period.from,
      periodEnd: period.to,
      metrics,
      previousMetrics,
      patternCounts,
    });

    return this.reportRepository.create({
      userId,
      type,
      title: text.title,
      summary: text.summary,
      metrics: {
        current: metrics,
        previous: previousMetrics ?? null,
        patternCounts,
      } as unknown as Prisma.InputJsonValue,
      periodStart: period.from,
      periodEnd: period.to,
    });
  }

  private async getReportOrThrow(id: string, userId: string): Promise<AiReport> {
    const report = await this.reportRepository.findById(id);

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.userId !== userId) {
      throw new ForbiddenException('You do not have access to this report');
    }

    return report;
  }
}
