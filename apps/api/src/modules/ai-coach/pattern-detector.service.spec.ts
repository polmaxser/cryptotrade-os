import { CoachInsightPattern, JournalTagCategory } from '@cryptotrade/database';

import { PatternDetectorService } from './pattern-detector.service';
import { CoachJournalTagInput, CoachTradeInput } from './types/pattern-detection';

let nextId = 1;

function trade(overrides: Partial<CoachTradeInput> = {}): CoachTradeInput {
  const id = overrides.id ?? `trade-${nextId++}`;
  return {
    id,
    symbol: 'BTCUSDT',
    side: 'LONG',
    quantity: 1,
    entryPrice: 100,
    pnl: null,
    status: 'CLOSED',
    openedAt: new Date('2026-01-01T08:00:00.000Z'),
    closedAt: new Date('2026-01-01T09:00:00.000Z'),
    ...overrides,
    id,
  };
}

function findPattern(
  findings: ReturnType<PatternDetectorService['detectAll']>,
  pattern: CoachInsightPattern,
) {
  return findings.find((f) => f.pattern === pattern);
}

describe('PatternDetectorService.detectAll — sample-size gate', () => {
  const service = new PatternDetectorService();

  it('returns no findings with fewer than 10 closed trades', () => {
    const trades = Array.from({ length: 9 }, (_, i) =>
      trade({ id: `t${i}`, pnl: i % 2 === 0 ? 1 : -1 }),
    );

    expect(service.detectAll(trades, [])).toEqual([]);
  });
});

describe('PatternDetectorService — REVENGE_TRADING', () => {
  const service = new PatternDetectorService();

  it('flags a pattern of oversized trades placed the same day as a loss', () => {
    const trades: CoachTradeInput[] = [];
    for (let day = 1; day <= 5; day++) {
      const d = String(day).padStart(2, '0');
      trades.push(
        trade({
          id: `loss${day}`,
          quantity: 1,
          entryPrice: 10, // notional 10
          pnl: -5,
          openedAt: new Date(`2026-01-${d}T07:00:00.000Z`),
          closedAt: new Date(`2026-01-${d}T08:00:00.000Z`),
        }),
      );
      trades.push(
        trade({
          id: `next${day}`,
          quantity: 1,
          entryPrice: 100, // notional 100 — 10x the loss trade
          pnl: 1,
          openedAt: new Date(`2026-01-${d}T09:00:00.000Z`),
          closedAt: new Date(`2026-01-${d}T10:00:00.000Z`),
        }),
      );
    }

    const findings = service.detectAll(trades, []);
    const finding = findPattern(findings, CoachInsightPattern.REVENGE_TRADING);

    expect(finding).toBeDefined();
    expect(finding?.metrics).toEqual({
      sampleSize: 5,
      avgSizeAfterLoss: 100,
      avgSizeOverall: 55,
      sizeRatio: 1.82,
    });
  });

  it('does not flag revenge trading when the follow-up trade is not meaningfully bigger', () => {
    const trades: CoachTradeInput[] = [];
    for (let day = 1; day <= 5; day++) {
      const d = String(day).padStart(2, '0');
      trades.push(
        trade({
          id: `loss${day}`,
          quantity: 1,
          entryPrice: 10,
          pnl: -5,
          openedAt: new Date(`2026-01-${d}T07:00:00.000Z`),
          closedAt: new Date(`2026-01-${d}T08:00:00.000Z`),
        }),
      );
      trades.push(
        trade({
          id: `next${day}`,
          quantity: 1,
          entryPrice: 14, // only 1.4x — below the 1.5x trigger
          pnl: 1,
          openedAt: new Date(`2026-01-${d}T09:00:00.000Z`),
          closedAt: new Date(`2026-01-${d}T10:00:00.000Z`),
        }),
      );
    }

    const findings = service.detectAll(trades, []);
    expect(findPattern(findings, CoachInsightPattern.REVENGE_TRADING)).toBeUndefined();
  });
});

describe('PatternDetectorService — HOLDING_LOSERS_TOO_LONG', () => {
  const service = new PatternDetectorService();

  it('flags losers held far longer than the overall average', () => {
    const trades = [
      ...Array.from({ length: 5 }, (_, i) =>
        trade({
          id: `loser${i}`,
          pnl: -1,
          openedAt: new Date('2026-01-01T00:00:00.000Z'),
          closedAt: new Date('2026-01-01T01:40:00.000Z'), // 100 minutes
        }),
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        trade({
          id: `winner${i}`,
          pnl: 1,
          openedAt: new Date('2026-01-02T00:00:00.000Z'),
          closedAt: new Date('2026-01-02T00:10:00.000Z'), // 10 minutes
        }),
      ),
    ];

    const findings = service.detectAll(trades, []);
    const finding = findPattern(findings, CoachInsightPattern.HOLDING_LOSERS_TOO_LONG);

    expect(finding).toBeDefined();
    expect(finding?.metrics).toEqual({
      sampleSize: 5,
      avgHoldLosersMinutes: 100,
      avgHoldAllMinutes: 55,
      ratio: 1.82,
    });
  });

  it('does not flag holding losers too long when the ratio stays under 1.6x', () => {
    const trades = [
      ...Array.from({ length: 5 }, (_, i) =>
        trade({
          id: `loser${i}`,
          pnl: -1,
          openedAt: new Date('2026-01-01T00:00:00.000Z'),
          closedAt: new Date('2026-01-01T00:30:00.000Z'), // 30 minutes
        }),
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        trade({
          id: `winner${i}`,
          pnl: 1,
          openedAt: new Date('2026-01-02T00:00:00.000Z'),
          closedAt: new Date('2026-01-02T00:10:00.000Z'), // 10 minutes
        }),
      ),
    ];

    const findings = service.detectAll(trades, []);
    expect(findPattern(findings, CoachInsightPattern.HOLDING_LOSERS_TOO_LONG)).toBeUndefined();
  });
});

describe('PatternDetectorService — CUTTING_WINNERS_SHORT', () => {
  const service = new PatternDetectorService();

  it('flags winners closed far faster than the overall average', () => {
    const trades = [
      ...Array.from({ length: 5 }, (_, i) =>
        trade({
          id: `winner${i}`,
          pnl: 1,
          openedAt: new Date('2026-01-01T00:00:00.000Z'),
          closedAt: new Date('2026-01-01T00:10:00.000Z'), // 10 minutes
        }),
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        trade({
          id: `loser${i}`,
          pnl: -1,
          openedAt: new Date('2026-01-02T00:00:00.000Z'),
          closedAt: new Date('2026-01-02T01:40:00.000Z'), // 100 minutes
        }),
      ),
    ];

    const findings = service.detectAll(trades, []);
    const finding = findPattern(findings, CoachInsightPattern.CUTTING_WINNERS_SHORT);

    expect(finding).toBeDefined();
    expect(finding?.metrics).toEqual({
      sampleSize: 5,
      avgHoldWinnersMinutes: 10,
      avgHoldAllMinutes: 55,
      ratio: 0.18,
    });
  });

  it('does not flag cutting winners short when winners are held over 60% of the average', () => {
    const trades = [
      ...Array.from({ length: 5 }, (_, i) =>
        trade({
          id: `winner${i}`,
          pnl: 1,
          openedAt: new Date('2026-01-01T00:00:00.000Z'),
          closedAt: new Date('2026-01-01T00:40:00.000Z'), // 40 minutes
        }),
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        trade({
          id: `loser${i}`,
          pnl: -1,
          openedAt: new Date('2026-01-02T00:00:00.000Z'),
          closedAt: new Date('2026-01-02T00:50:00.000Z'), // 50 minutes
        }),
      ),
    ];

    const findings = service.detectAll(trades, []);
    expect(findPattern(findings, CoachInsightPattern.CUTTING_WINNERS_SHORT)).toBeUndefined();
  });
});

describe('PatternDetectorService — TIME_OF_DAY_WEAKNESS', () => {
  const service = new PatternDetectorService();

  it('flags the worst hour-of-day bucket when its win rate lags the overall by 20+ points', () => {
    const trades = [
      ...Array.from({ length: 5 }, (_, i) =>
        trade({
          id: `morning${i}`,
          pnl: 1,
          openedAt: new Date(`2026-01-${String(i + 1).padStart(2, '0')}T08:00:00.000Z`), // morning bucket, all winners
        }),
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        trade({
          id: `afternoon${i}`,
          pnl: -1,
          openedAt: new Date(`2026-01-${String(i + 6).padStart(2, '0')}T14:00:00.000Z`), // afternoon bucket, all losers
        }),
      ),
    ];

    const findings = service.detectAll(trades, []);
    const finding = findPattern(findings, CoachInsightPattern.TIME_OF_DAY_WEAKNESS);

    expect(finding).toBeDefined();
    expect(finding?.metrics).toEqual({
      bucketType: 'hour',
      bucketLabel: 'afternoon (12-18 UTC)',
      bucketWinRate: 0,
      overallWinRate: 50,
      sampleSize: 5,
    });
  });

  it('does not flag time-of-day weakness when the deficit stays under 20 points', () => {
    const trades = [
      ...Array.from({ length: 5 }, (_, i) =>
        trade({
          id: `morning${i}`,
          pnl: 1,
          openedAt: new Date(`2026-01-0${i + 1}T08:00:00.000Z`),
        }),
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        trade({
          id: `afternoonWin${i}`,
          pnl: 1,
          openedAt: new Date(`2026-01-0${i + 6}T14:00:00.000Z`),
        }),
      ),
      trade({ id: 'afternoonLoss', pnl: -1, openedAt: new Date('2026-01-10T14:00:00.000Z') }),
    ];

    const findings = service.detectAll(trades, []);
    expect(findPattern(findings, CoachInsightPattern.TIME_OF_DAY_WEAKNESS)).toBeUndefined();
  });
});

describe('PatternDetectorService — TAG_CORRELATION', () => {
  const service = new PatternDetectorService();

  function journalRow(tradeId: string, tagName: string): CoachJournalTagInput {
    return {
      tradeId,
      tags: [{ id: tagName, name: tagName, category: JournalTagCategory.EMOTION }],
    };
  }

  it('flags an emotion tag whose trades win 25+ points less than the portfolio average', () => {
    const winners = Array.from({ length: 7 }, (_, i) => trade({ id: `win${i}`, pnl: 1 }));
    const losers = Array.from({ length: 3 }, (_, i) => trade({ id: `fomo${i}`, pnl: -1 }));
    const trades = [...winners, ...losers];
    const journalRows = losers.map((t) => journalRow(t.id, 'FOMO'));

    const findings = service.detectAll(trades, journalRows);
    const finding = findPattern(findings, CoachInsightPattern.TAG_CORRELATION);

    expect(finding).toBeDefined();
    expect(finding?.metrics).toEqual({
      tagName: 'FOMO',
      tagWinRate: 0,
      overallWinRate: 70,
      sampleSize: 3,
    });
  });

  it('ignores non-EMOTION tags entirely', () => {
    const winners = Array.from({ length: 7 }, (_, i) => trade({ id: `win${i}`, pnl: 1 }));
    const losers = Array.from({ length: 3 }, (_, i) => trade({ id: `loss${i}`, pnl: -1 }));
    const trades = [...winners, ...losers];
    const journalRows: CoachJournalTagInput[] = losers.map((t) => ({
      tradeId: t.id,
      tags: [{ id: 'setup', name: 'Breakout', category: JournalTagCategory.STRATEGY }],
    }));

    const findings = service.detectAll(trades, journalRows);
    expect(findPattern(findings, CoachInsightPattern.TAG_CORRELATION)).toBeUndefined();
  });
});

describe('PatternDetectorService — OVERTRADING', () => {
  const service = new PatternDetectorService();

  it('flags an outlier trade-count day with a depressed win rate', () => {
    const quietDays = Array.from({ length: 5 }, (_, day) =>
      Array.from({ length: 2 }, (_, i) =>
        trade({
          id: `quiet${day}-${i}`,
          pnl: 1,
          openedAt: new Date(`2026-01-0${day + 1}T0${i}:00:00.000Z`),
        }),
      ),
    ).flat();

    const outlierDay = Array.from({ length: 10 }, (_, i) =>
      trade({
        id: `outlier${i}`,
        pnl: i < 2 ? 1 : -1, // 2 wins, 8 losses -> 20% win rate that day
        openedAt: new Date(`2026-01-06T${String(i).padStart(2, '0')}:00:00.000Z`),
      }),
    );

    const trades = [...quietDays, ...outlierDay];

    const findings = service.detectAll(trades, []);
    const finding = findPattern(findings, CoachInsightPattern.OVERTRADING);

    expect(finding).toBeDefined();
    expect(finding?.metrics).toEqual({
      date: '2026-01-06',
      tradeCount: 10,
      avgDailyTradeCount: 3.33,
      winRateThatDay: 20,
      overallWinRate: 60,
    });
  });

  it('does not flag overtrading when daily trade counts are uniform', () => {
    const trades = Array.from({ length: 6 }, (_, day) =>
      Array.from({ length: 2 }, (_, i) =>
        trade({
          id: `day${day}-${i}`,
          pnl: i === 0 ? 1 : -1,
          openedAt: new Date(`2026-01-0${day + 1}T0${i}:00:00.000Z`),
        }),
      ),
    ).flat();

    const findings = service.detectAll(trades, []);
    expect(findPattern(findings, CoachInsightPattern.OVERTRADING)).toBeUndefined();
  });
});

describe('PatternDetectorService — POSITION_SIZE_INCONSISTENCY', () => {
  const service = new PatternDetectorService();

  it('flags highly inconsistent sizing that has no relationship with outcome', () => {
    const pnlPattern = [1, -1, 1, -1, 1];
    const small = pnlPattern.map((pnl, i) =>
      trade({ id: `small${i}`, quantity: 10, entryPrice: 1, pnl }),
    );
    const large = pnlPattern.map((pnl, i) =>
      trade({ id: `large${i}`, quantity: 100, entryPrice: 1, pnl }),
    );
    const trades = [...small, ...large];

    const findings = service.detectAll(trades, []);
    const finding = findPattern(findings, CoachInsightPattern.POSITION_SIZE_INCONSISTENCY);

    expect(finding).toBeDefined();
    expect(finding?.metrics).toEqual({
      sampleSize: 10,
      coefficientOfVariation: 0.86,
      correlationWithPnl: 0,
      avgSize: 55,
    });
  });

  it('does not flag position sizing when sizes are fairly consistent', () => {
    const trades = Array.from({ length: 10 }, (_, i) =>
      trade({
        id: `t${i}`,
        quantity: 50 + i, // 50..59 — low variance
        entryPrice: 1,
        pnl: i % 2 === 0 ? 1 : -1,
      }),
    );

    const findings = service.detectAll(trades, []);
    expect(findPattern(findings, CoachInsightPattern.POSITION_SIZE_INCONSISTENCY)).toBeUndefined();
  });
});
