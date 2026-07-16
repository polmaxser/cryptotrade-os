import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { CoachInsightPattern } from '@cryptotrade/database';

import { PatternFinding } from './types/pattern-detection';

export interface CoachInsightText {
  title: string;
  description: string;
}

const PATTERN_LABELS: Record<CoachInsightPattern, string> = {
  REVENGE_TRADING: 'Revenge trading — larger trades right after a loss, same day',
  HOLDING_LOSERS_TOO_LONG: 'Holding losing trades far longer than average',
  CUTTING_WINNERS_SHORT: 'Closing winning trades far faster than average',
  TIME_OF_DAY_WEAKNESS: 'Win rate drop in a specific time window',
  TAG_CORRELATION: 'Trades tagged with a given emotion underperforming',
  OVERTRADING: 'A trade-count spike on one day, with a same-day win rate drop',
  POSITION_SIZE_INCONSISTENCY: 'Highly inconsistent position sizing, uncorrelated with outcome',
};

const SYSTEM_PROMPT = `You are AI Coach inside a crypto trading platform. You turn an already-computed,
statistically significant behavioral pattern into a short, human explanation for the trader who produced it.

Rules:
- The pattern and its numbers are already verified — do not question, recompute, or hedge on whether it's real.
- Never give directional market advice (never say buy/sell/hold anything).
- Never diagnose the trader psychologically — describe the observed behavior in the data, not their character.
- Be concrete: reference the actual numbers you were given.
- Keep it tight: a title under 60 characters, and a description of 2-4 sentences covering what's happening and
  what it may be worth paying attention to (not a prescription, an observation).
- Respond with ONLY a JSON object of the form {"title": "...", "description": "..."} — no markdown, no code fences, no extra text.`;

@Injectable()
export class CoachLlmService {
  private readonly logger = new Logger(CoachLlmService.name);
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

  async phraseFinding(finding: PatternFinding): Promise<CoachInsightText> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'AI Coach is not configured yet — no Anthropic API key is set',
      );
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(finding) }],
    });

    const block = response.content.find((c) => c.type === 'text');
    if (!block || block.type !== 'text') {
      throw new ServiceUnavailableException('AI Coach received an empty response from the model');
    }

    return parseInsightText(block.text, this.logger);
  }
}

function buildUserPrompt(finding: PatternFinding): string {
  const label = PATTERN_LABELS[finding.pattern];
  const metricsLines = Object.entries(finding.metrics)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');

  return `Pattern detected: ${label}\n\nComputed metrics:\n${metricsLines}\n\nWrite the title and description now.`;
}

function parseInsightText(raw: string, logger: Logger): CoachInsightText {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Partial<CoachInsightText>;
    if (typeof parsed.title === 'string' && typeof parsed.description === 'string') {
      return { title: parsed.title, description: parsed.description };
    }
  } catch (err) {
    logger.warn(`Failed to parse AI Coach response as JSON: ${(err as Error).message}`);
  }

  return { title: 'New pattern detected', description: cleaned };
}
