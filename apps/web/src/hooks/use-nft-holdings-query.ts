'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchNftHoldings } from '@/lib/api/nft-holdings';
import { QUERY_KEYS } from '@/lib/constants';

export function useNftHoldingsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.nftHoldings,
    queryFn: fetchNftHoldings,
  });
}
