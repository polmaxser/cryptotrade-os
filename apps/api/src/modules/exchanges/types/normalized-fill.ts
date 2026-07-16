/**
 * A single trade execution, normalized to a common shape regardless of which
 * exchange it came from. Every exchange client maps its own raw response
 * format into this before handing fills to the shared position matcher.
 */
export interface NormalizedFill {
  id: string;
  price: number;
  qty: number;
  isBuyer: boolean;
  time: number;
}
