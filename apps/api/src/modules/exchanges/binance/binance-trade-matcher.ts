import { BinanceFill } from './binance-client.service';

export interface MatchedTrade {
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  pnl: number | null;
  status: 'OPEN' | 'CLOSED';
  openedAt: Date;
  closedAt: Date | null;
}

interface OpenPosition {
  side: 'LONG' | 'SHORT';
  entryNotional: number;
  entryQuantity: number;
  exitNotional: number;
  exitQuantity: number;
  openedAt: Date;
}

const EPSILON = 1e-12;

/**
 * Turns a stream of individual fills into round-trip trades using
 * weighted-average position accounting: fills on the same side as the current
 * position extend it (and adjust the average entry price); opposite-side
 * fills realize PnL against it. A trade is emitted once the position returns
 * to flat. A fill that overshoots a full close flips into a new position in
 * the opposite direction. Any position still open at the end of the fill
 * history is emitted as a single OPEN trade. Commission is intentionally not
 * netted into PnL — the fee asset varies per fill and isn't always the quote
 * asset, so converting it accurately is out of scope here.
 */
export function matchFillsToTrades(fills: BinanceFill[]): MatchedTrade[] {
  const sorted = [...fills].sort((a, b) => a.time - b.time || a.id - b.id);
  const trades: MatchedTrade[] = [];
  let position: OpenPosition | null = null;

  for (const fill of sorted) {
    const price = Number(fill.price);
    const fillTime = new Date(fill.time);
    const isBuy = fill.isBuyer;
    let remainingQty = Number(fill.qty);

    while (remainingQty > EPSILON) {
      if (!position) {
        position = {
          side: isBuy ? 'LONG' : 'SHORT',
          entryNotional: 0,
          entryQuantity: 0,
          exitNotional: 0,
          exitQuantity: 0,
          openedAt: fillTime,
        };
      }

      const sameDirection =
        (position.side === 'LONG' && isBuy) || (position.side === 'SHORT' && !isBuy);

      if (sameDirection) {
        position.entryNotional += remainingQty * price;
        position.entryQuantity += remainingQty;
        remainingQty = 0;
        continue;
      }

      const openQuantity = position.entryQuantity - position.exitQuantity;
      const closingQty = Math.min(remainingQty, openQuantity);

      position.exitNotional += closingQty * price;
      position.exitQuantity += closingQty;
      remainingQty -= closingQty;

      if (position.entryQuantity - position.exitQuantity <= EPSILON) {
        trades.push(closePosition(position, fillTime));
        position = null;
      }
    }
  }

  if (position && position.entryQuantity - position.exitQuantity > EPSILON) {
    const openQuantity = position.entryQuantity - position.exitQuantity;
    trades.push({
      side: position.side,
      entryPrice: position.entryNotional / position.entryQuantity,
      exitPrice: null,
      quantity: openQuantity,
      pnl: null,
      status: 'OPEN',
      openedAt: position.openedAt,
      closedAt: null,
    });
  }

  return trades;
}

function closePosition(position: OpenPosition, closedAt: Date): MatchedTrade {
  const entryPrice = position.entryNotional / position.entryQuantity;
  const exitPrice = position.exitNotional / position.exitQuantity;
  const pnl =
    position.side === 'LONG'
      ? (exitPrice - entryPrice) * position.exitQuantity
      : (entryPrice - exitPrice) * position.exitQuantity;

  return {
    side: position.side,
    entryPrice,
    exitPrice,
    quantity: position.exitQuantity,
    pnl,
    status: 'CLOSED',
    openedAt: position.openedAt,
    closedAt,
  };
}
