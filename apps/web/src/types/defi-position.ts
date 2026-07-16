export type DeFiPositionType =
  'LIQUIDITY_POOL' | 'STAKING' | 'LENDING' | 'BORROWING' | 'YIELD_FARMING';

export type DeFiPosition = {
  id: string;
  protocol: string;
  type: DeFiPositionType;
  asset: string;
  amount: string;
  valueUsd: string;
  apy: string | null;
  notes: string | null;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  portfolioId: string | null;
};

export type CreateDeFiPositionPayload = {
  protocol: string;
  type: DeFiPositionType;
  asset: string;
  amount: number;
  valueUsd: number;
  apy?: number;
  notes?: string;
  openedAt: string;
  closedAt?: string;
  portfolioId?: string;
};

export type UpdateDeFiPositionPayload = Partial<CreateDeFiPositionPayload>;
