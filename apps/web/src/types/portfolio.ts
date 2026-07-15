export type Portfolio = {
  id: string;
  name: string;
  description: string | null;
  type: 'SPOT';
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
