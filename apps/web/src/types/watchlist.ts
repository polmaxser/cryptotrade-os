export type WatchlistItem = {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  createdAt: string;
  userId: string;
  price: number | null;
  change24h: number | null;
};

export type CoinSearchResult = {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
};

export type AddWatchlistItemPayload = {
  coinId: string;
  symbol: string;
  name: string;
};
