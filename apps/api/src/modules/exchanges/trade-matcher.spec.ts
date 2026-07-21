import { matchFillsToTrades } from './trade-matcher';
import { NormalizedFill } from './types/normalized-fill';

function fill(overrides: Partial<NormalizedFill> & { id: string }): NormalizedFill {
  return { symbol: 'BTCUSDT', price: 0, qty: 0, isBuyer: true, time: 0, ...overrides };
}

describe('matchFillsToTrades', () => {
  it('returns an empty array for no fills', () => {
    expect(matchFillsToTrades([])).toEqual([]);
  });

  it('matches a simple long round trip', () => {
    const trades = matchFillsToTrades([
      fill({ id: '1', isBuyer: true, qty: 1, price: 100, time: 1 }),
      fill({ id: '2', isBuyer: false, qty: 1, price: 110, time: 2 }),
    ]);

    expect(trades).toEqual([
      {
        side: 'LONG',
        entryPrice: 100,
        exitPrice: 110,
        quantity: 1,
        pnl: 10,
        status: 'CLOSED',
        openedAt: new Date(1),
        closedAt: new Date(2),
      },
    ]);
  });

  it('matches a simple short round trip', () => {
    const trades = matchFillsToTrades([
      fill({ id: '1', isBuyer: false, qty: 1, price: 100, time: 1 }),
      fill({ id: '2', isBuyer: true, qty: 1, price: 90, time: 2 }),
    ]);

    expect(trades).toEqual([
      {
        side: 'SHORT',
        entryPrice: 100,
        exitPrice: 90,
        quantity: 1,
        pnl: 10,
        status: 'CLOSED',
        openedAt: new Date(1),
        closedAt: new Date(2),
      },
    ]);
  });

  it('weight-averages the entry price across same-direction fills', () => {
    const trades = matchFillsToTrades([
      fill({ id: '1', isBuyer: true, qty: 1, price: 100, time: 1 }),
      fill({ id: '2', isBuyer: true, qty: 1, price: 200, time: 2 }),
      fill({ id: '3', isBuyer: false, qty: 2, price: 180, time: 3 }),
    ]);

    expect(trades).toHaveLength(1);
    expect(trades[0]).toMatchObject({
      entryPrice: 150,
      exitPrice: 180,
      quantity: 2,
      pnl: 60,
      status: 'CLOSED',
    });
  });

  it('merges partial closes into a single trade until the position is flat', () => {
    const trades = matchFillsToTrades([
      fill({ id: '1', isBuyer: true, qty: 2, price: 100, time: 1 }),
      fill({ id: '2', isBuyer: false, qty: 1, price: 110, time: 2 }),
      fill({ id: '3', isBuyer: false, qty: 1, price: 130, time: 3 }),
    ]);

    expect(trades).toHaveLength(1);
    expect(trades[0]).toMatchObject({
      entryPrice: 100,
      exitPrice: 120, // weighted average of 110 and 130
      quantity: 2,
      pnl: 40,
      status: 'CLOSED',
    });
  });

  it('flips into a new opposite-side position when a fill overshoots a full close', () => {
    const trades = matchFillsToTrades([
      fill({ id: '1', isBuyer: true, qty: 1, price: 100, time: 1 }),
      fill({ id: '2', isBuyer: false, qty: 3, price: 90, time: 2 }),
    ]);

    expect(trades).toHaveLength(2);
    expect(trades[0]).toMatchObject({
      side: 'LONG',
      entryPrice: 100,
      exitPrice: 90,
      quantity: 1,
      pnl: -10,
      status: 'CLOSED',
    });
    expect(trades[1]).toMatchObject({
      side: 'SHORT',
      entryPrice: 90,
      exitPrice: null,
      quantity: 2,
      pnl: null,
      status: 'OPEN',
      closedAt: null,
    });
  });

  it('leaves a trailing unclosed position as a single OPEN trade', () => {
    const trades = matchFillsToTrades([
      fill({ id: '1', isBuyer: true, qty: 1, price: 100, time: 1 }),
    ]);

    expect(trades).toEqual([
      {
        side: 'LONG',
        entryPrice: 100,
        exitPrice: null,
        quantity: 1,
        pnl: null,
        status: 'OPEN',
        openedAt: new Date(1),
        closedAt: null,
      },
    ]);
  });

  it('sorts out-of-order fills by time before matching', () => {
    const trades = matchFillsToTrades([
      fill({ id: '2', isBuyer: false, qty: 1, price: 110, time: 2 }),
      fill({ id: '1', isBuyer: true, qty: 1, price: 100, time: 1 }),
    ]);

    expect(trades).toEqual([
      {
        side: 'LONG',
        entryPrice: 100,
        exitPrice: 110,
        quantity: 1,
        pnl: 10,
        status: 'CLOSED',
        openedAt: new Date(1),
        closedAt: new Date(2),
      },
    ]);
  });

  it('breaks ties on identical timestamps by fill id', () => {
    const trades = matchFillsToTrades([
      fill({ id: 'b', isBuyer: false, qty: 1, price: 110, time: 1 }),
      fill({ id: 'a', isBuyer: true, qty: 1, price: 100, time: 1 }),
    ]);

    expect(trades).toEqual([
      {
        side: 'LONG',
        entryPrice: 100,
        exitPrice: 110,
        quantity: 1,
        pnl: 10,
        status: 'CLOSED',
        openedAt: new Date(1),
        closedAt: new Date(1),
      },
    ]);
  });

  it('emits one trade per independent round trip', () => {
    const trades = matchFillsToTrades([
      fill({ id: '1', isBuyer: true, qty: 1, price: 100, time: 1 }),
      fill({ id: '2', isBuyer: false, qty: 1, price: 110, time: 2 }),
      fill({ id: '3', isBuyer: true, qty: 1, price: 120, time: 3 }),
      fill({ id: '4', isBuyer: false, qty: 1, price: 100, time: 4 }),
    ]);

    expect(trades).toHaveLength(2);
    expect(trades[0]).toMatchObject({ entryPrice: 100, exitPrice: 110, pnl: 10 });
    expect(trades[1]).toMatchObject({ entryPrice: 120, exitPrice: 100, pnl: -20 });
  });
});
