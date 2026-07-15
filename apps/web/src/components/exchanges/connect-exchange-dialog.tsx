'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createExchangeConnection } from '@/lib/api/exchanges';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';

export function ConnectExchangeDialog() {
  const t = useTranslations('exchanges.connect');
  const tErrors = useTranslations('auth.errors');
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createExchangeConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.exchangeConnections });
      setOpen(false);
      setLabel('');
      setApiKey('');
      setApiSecret('');
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    mutation.mutate({ exchange: 'BINANCE', label, apiKey, apiSecret });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {t('trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          {t('readOnlyWarning')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="connectionLabel">{t('labelLabel')}</Label>
            <Input
              id="connectionLabel"
              required
              placeholder={t('labelPlaceholder')}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">{t('apiKeyLabel')}</Label>
            <Input
              id="apiKey"
              required
              autoComplete="off"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiSecret">{t('apiSecretLabel')}</Label>
            <Input
              id="apiSecret"
              type="password"
              required
              autoComplete="off"
              value={apiSecret}
              onChange={(event) => setApiSecret(event.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('connecting') : t('connect')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
