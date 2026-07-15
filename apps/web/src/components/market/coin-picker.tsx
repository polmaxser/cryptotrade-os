'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useCoinSearchQuery } from '@/hooks/use-coin-search-query';
import type { CoinSearchResult } from '@/types/watchlist';

type CoinPickerProps = {
  onSelect: (coin: CoinSearchResult) => void;
  placeholder?: string;
};

export function CoinPicker({ onSelect, placeholder }: CoinPickerProps) {
  const [query, setQuery] = useState('');
  const searchQuery = useCoinSearchQuery(query);
  const results = searchQuery.data ?? [];

  function handleSelect(coin: CoinSearchResult) {
    onSelect(coin);
    setQuery('');
  }

  return (
    <div className="space-y-2">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
      />

      {query.trim().length >= 2 && results.length > 0 ? (
        <div className="border-border/60 max-h-48 space-y-0.5 overflow-y-auto rounded-md border p-1">
          {results.map((coin) => (
            <button
              key={coin.id}
              type="button"
              onClick={() => handleSelect(coin)}
              className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors"
            >
              <img src={coin.thumb} alt="" className="h-5 w-5 rounded-full" />
              <span className="font-medium">{coin.name}</span>
              <span className="text-muted-foreground text-xs uppercase">{coin.symbol}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
