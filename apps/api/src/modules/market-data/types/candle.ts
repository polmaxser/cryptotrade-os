export interface Candle {
  /** Bar open time, ms since epoch. */
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
