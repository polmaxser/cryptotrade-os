export type AlertDirection = 'ABOVE' | 'BELOW';
export type AlertStatus = 'ACTIVE' | 'TRIGGERED';

export type PriceAlert = {
  id: string;
  coinId: string;
  symbol: string;
  direction: AlertDirection;
  targetPrice: string;
  status: AlertStatus;
  triggeredAt: string | null;
  createdAt: string;
  userId: string;
};

export type CreatePriceAlertPayload = {
  coinId: string;
  symbol: string;
  direction: AlertDirection;
  targetPrice: number;
};
