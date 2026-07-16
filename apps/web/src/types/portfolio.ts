export type PortfolioType = 'SPOT' | 'FUTURES' | 'DEFI' | 'NFT';

export type Portfolio = {
  id: string;
  name: string;
  description: string | null;
  type: PortfolioType;
  baseCurrency: string;
  startingBalance: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  _count: {
    trades: number;
  };
};

export type UpdatePortfolioPayload = {
  startingBalance?: number;
};
