import { WatchlistItem } from '@cryptotrade/database';

export type WatchlistItemWithPrice = WatchlistItem & {
  price: number | null;
  change24h: number | null;
};
