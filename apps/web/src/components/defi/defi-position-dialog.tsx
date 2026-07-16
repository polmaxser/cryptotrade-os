'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { createDeFiPosition, updateDeFiPosition } from '@/lib/api/defi-positions';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '@/lib/date';
import type { DeFiPosition, DeFiPositionType } from '@/types/defi-position';

const POSITION_TYPES: DeFiPositionType[] = [
  'LIQUIDITY_POOL',
  'STAKING',
  'LENDING',
  'BORROWING',
  'YIELD_FARMING',
];

type DeFiPositionDialogProps = {
  position?: DeFiPosition;
  children: ReactNode;
};

export function DeFiPositionDialog({ position, children }: DeFiPositionDialogProps) {
  const t = useTranslations('defi.dialog');
  const tErrors = useTranslations('auth.errors');
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [protocol, setProtocol] = useState(position?.protocol ?? '');
  const [type, setType] = useState<DeFiPositionType>(position?.type ?? 'LIQUIDITY_POOL');
  const [asset, setAsset] = useState(position?.asset ?? '');
  const [amount, setAmount] = useState(position?.amount ?? '');
  const [valueUsd, setValueUsd] = useState(position?.valueUsd ?? '');
  const [apy, setApy] = useState(position?.apy ?? '');
  const [openedAt, setOpenedAt] = useState(() =>
    toDatetimeLocalValue(position?.openedAt ? new Date(position.openedAt) : new Date()),
  );
  const [notes, setNotes] = useState(position?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        protocol,
        type,
        asset,
        amount: Number(amount),
        valueUsd: Number(valueUsd),
        apy: apy === '' ? undefined : Number(apy),
        notes: notes.trim() || undefined,
        openedAt: fromDatetimeLocalValue(openedAt),
      };

      return position ? updateDeFiPosition(position.id, payload) : createDeFiPosition(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.defiPositions });
      setOpen(false);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen && !position) {
      setProtocol('');
      setType('LIQUIDITY_POOL');
      setAsset('');
      setAmount('');
      setValueUsd('');
      setApy('');
      setOpenedAt(toDatetimeLocalValue(new Date()));
      setNotes('');
      setError(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{position ? t('editTitle') : t('createTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="protocol">{t('protocolLabel')}</Label>
              <Input
                id="protocol"
                required
                placeholder="Aave"
                value={protocol}
                onChange={(event) => setProtocol(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="positionType">{t('typeLabel')}</Label>
              <select
                id="positionType"
                value={type}
                onChange={(event) => setType(event.target.value as DeFiPositionType)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                {POSITION_TYPES.map((positionType) => (
                  <option key={positionType} value={positionType}>
                    {t(`types.${positionType}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asset">{t('assetLabel')}</Label>
            <Input
              id="asset"
              required
              placeholder="ETH/USDC"
              value={asset}
              onChange={(event) => setAsset(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t('amountLabel')}</Label>
              <Input
                id="amount"
                type="number"
                step="any"
                min="0"
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valueUsd">{t('valueUsdLabel')}</Label>
              <Input
                id="valueUsd"
                type="number"
                step="any"
                min="0"
                required
                value={valueUsd}
                onChange={(event) => setValueUsd(event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apy">{t('apyLabel')}</Label>
              <Input
                id="apy"
                type="number"
                step="any"
                min="0"
                value={apy}
                onChange={(event) => setApy(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="openedAt">{t('openedAtLabel')}</Label>
              <Input
                id="openedAt"
                type="datetime-local"
                required
                value={openedAt}
                onChange={(event) => setOpenedAt(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defiNotes">{t('notesLabel')}</Label>
            <Textarea
              id="defiNotes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('saving') : position ? t('saveChanges') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
