import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AiReportType } from '@cryptotrade/database';

import { AnalyticsSummary } from '@/modules/analytics/types/analytics-summary';

export interface ReportInput {
  type: AiReportType;
  periodStart: Date;
  periodEnd: Date;
  metrics: AnalyticsSummary;
  /** Only present for WEEKLY/MONTHLY — the immediately preceding period, for comparison. */
  previousMetrics?: AnalyticsSummary;
  /** AI Coach findings created within the period — how many of each pattern fired. */
  patternCounts: Record<string, number>;
}

export interface ReportText {
  title: string;
  summary: string;
}

const TONE_BY_TYPE: Record<AiReportType, string> = {
  DAILY:
    "Short — 2-4 sentences. Just the day's PnL and, if there is one, the single most notable pattern.",
  WEEKLY:
    "A fuller review — a short paragraph. Cover the week's numbers, how they compare to the prior week, and any recurring or newly-appeared patterns.",
  MONTHLY:
    "A complete report — 2-3 short paragraphs. Cover the month's metric trends, recurring patterns across the month, and explicit progress or regression versus the prior month.",
};

const SYSTEM_PROMPT = `You are AI Reports inside a crypto trading platform. You turn already-computed
trading statistics for a period (and, where given, the prior period for comparison) into a short,
human-readable digest for the trader.

Rules:
- The numbers are already computed and verified — do not question or recompute them, just narrate them.
- Never give directional market advice (never say buy/sell/hold anything).
- Never diagnose the trader psychologically — describe what the data shows, not their character.
- Be concrete: reference the actual numbers you were given, including the comparison to the prior
  period when one is provided.
- Respond with ONLY a JSON object of the form {"title": "...", "summary": "..."} — no markdown, no
  code fences, no extra text. Title under 60 characters.`;

@Injectable()
export class ReportLlmService {
  private readonly logger = new Logger(ReportLlmService.name);
  private readonly client: Anthropic | null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('aiCoach.anthropicApiKey');
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
    this.model = this.configService.get<string>('aiCoach.anthropicModel') ?? 'claude-sonnet-5';
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async phraseReport(input: ReportInput): Promise<ReportText> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'AI Reports is not configured yet — no Anthropic API key is set',
      );
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(input) }],
    });

    const block = response.content.find((c) => c.type === 'text');
    if (!block || block.type !== 'text') {
      throw new ServiceUnavailableException('AI Reports received an empty response from the model');
    }

    return parseReportText(block.text, this.logger);
  }
}

function buildUserPrompt(input: ReportInput): string {
  const lines = [
    `Report type: ${input.type}`,
    `Tone/length: ${TONE_BY_TYPE[input.type]}`,
    `Period: ${input.periodStart.toISOString()} to ${input.periodEnd.toISOString()}`,
    '',
    'Current period metrics:',
    JSON.stringify(input.metrics, null, 2),
  ];

  if (input.previousMetrics) {
    lines.push(
      '',
      'Prior period metrics (for comparison):',
      JSON.stringify(input.previousMetrics, null, 2),
    );
  }

  const patternEntries = Object.entries(input.patternCounts);
  lines.push(
    '',
    patternEntries.length > 0
      ? `AI Coach patterns detected in this period: ${patternEntries.map(([p, c]) => `${p} (${c}x)`).join(', ')}`
      : 'No AI Coach patterns were detected in this period.',
  );

  lines.push('', 'Write the title and summary now.');

  return lines.join('\n');
}

function parseReportText(raw: string, logger: Logger): ReportText {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Partial<ReportText>;
    if (typeof parsed.title === 'string' && typeof parsed.summary === 'string') {
      return { title: parsed.title, summary: parsed.summary };
    }
  } catch (err) {
    logger.warn(`Failed to parse AI Reports response as JSON: ${(err as Error).message}`);
  }

  return { title: 'New report', summary: cleaned };
}
