/**
 * A single trade execution, normalized to a common shape regardless of which
 * exchange it came from. Every exchange client maps its own raw response
 * format into this before handing fills to the shared position matcher.
 */
export interface NormalizedFill {
  id: string;
  /**
   * The exchange's own symbol for this fill. Redundant when a client is
   * called with an explicit symbol (every fill matches it), but required
   * when a client is asked for fills across all symbols at once — that's
   * the only way the caller can tell which symbol each fill belongs to.
   */
  symbol: string;
  price: number;
  qty: number;
  isBuyer: boolean;
  time: number;
}
