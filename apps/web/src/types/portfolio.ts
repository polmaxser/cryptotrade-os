export type Portfolio = {
  id: string;
  name: string;
  description: string | null;
  type: 'SPOT';
  baseCurrency: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  _count: {
    trades: number;
  };
};
