export type EconomicEventCategory = 'FOMC' | 'CPI' | 'NFP';
export type EconomicEventImportance = 'HIGH' | 'MEDIUM' | 'LOW';

export type EconomicEvent = {
  id: string;
  category: EconomicEventCategory;
  importance: EconomicEventImportance;
  country: string;
  title: string;
  description: string | null;
  eventDate: string;
  forecast: string | null;
  previous: string | null;
  actual: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListEconomicEventsParams = {
  from: string;
  to: string;
  category?: EconomicEventCategory;
};
