export type NftHolding = {
  id: string;
  collectionName: string;
  tokenId: string;
  contractAddress: string | null;
  imageUrl: string | null;
  acquiredPriceUsd: string | null;
  currentFloorPriceUsd: string | null;
  notes: string | null;
  acquiredAt: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  portfolioId: string | null;
};

export type CreateNftHoldingPayload = {
  collectionName: string;
  tokenId: string;
  contractAddress?: string;
  imageUrl?: string;
  acquiredPriceUsd?: number;
  currentFloorPriceUsd?: number;
  notes?: string;
  acquiredAt: string;
  portfolioId?: string;
};

export type UpdateNftHoldingPayload = Partial<CreateNftHoldingPayload>;
