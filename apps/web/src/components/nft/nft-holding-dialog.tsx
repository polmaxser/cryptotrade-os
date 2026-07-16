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
import { createNftHolding, updateNftHolding } from '@/lib/api/nft-holdings';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '@/lib/date';
import type { NftHolding } from '@/types/nft-holding';

type NftHoldingDialogProps = {
  holding?: NftHolding;
  children: ReactNode;
};

export function NftHoldingDialog({ holding, children }: NftHoldingDialogProps) {
  const t = useTranslations('nft.dialog');
  const tErrors = useTranslations('auth.errors');
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [collectionName, setCollectionName] = useState(holding?.collectionName ?? '');
  const [tokenId, setTokenId] = useState(holding?.tokenId ?? '');
  const [contractAddress, setContractAddress] = useState(holding?.contractAddress ?? '');
  const [imageUrl, setImageUrl] = useState(holding?.imageUrl ?? '');
  const [acquiredPriceUsd, setAcquiredPriceUsd] = useState(holding?.acquiredPriceUsd ?? '');
  const [currentFloorPriceUsd, setCurrentFloorPriceUsd] = useState(
    holding?.currentFloorPriceUsd ?? '',
  );
  const [acquiredAt, setAcquiredAt] = useState(() =>
    toDatetimeLocalValue(holding?.acquiredAt ? new Date(holding.acquiredAt) : new Date()),
  );
  const [notes, setNotes] = useState(holding?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        collectionName,
        tokenId,
        contractAddress: contractAddress.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        acquiredPriceUsd: acquiredPriceUsd === '' ? undefined : Number(acquiredPriceUsd),
        currentFloorPriceUsd:
          currentFloorPriceUsd === '' ? undefined : Number(currentFloorPriceUsd),
        notes: notes.trim() || undefined,
        acquiredAt: fromDatetimeLocalValue(acquiredAt),
      };

      return holding ? updateNftHolding(holding.id, payload) : createNftHolding(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nftHoldings });
      setOpen(false);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen && !holding) {
      setCollectionName('');
      setTokenId('');
      setContractAddress('');
      setImageUrl('');
      setAcquiredPriceUsd('');
      setCurrentFloorPriceUsd('');
      setAcquiredAt(toDatetimeLocalValue(new Date()));
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
          <DialogTitle>{holding ? t('editTitle') : t('createTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="collectionName">{t('collectionLabel')}</Label>
              <Input
                id="collectionName"
                required
                placeholder="Bored Ape Yacht Club"
                value={collectionName}
                onChange={(event) => setCollectionName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tokenId">{t('tokenIdLabel')}</Label>
              <Input
                id="tokenId"
                required
                value={tokenId}
                onChange={(event) => setTokenId(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractAddress">{t('contractAddressLabel')}</Label>
            <Input
              id="contractAddress"
              value={contractAddress}
              onChange={(event) => setContractAddress(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">{t('imageUrlLabel')}</Label>
            <Input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acquiredPriceUsd">{t('acquiredPriceLabel')}</Label>
              <Input
                id="acquiredPriceUsd"
                type="number"
                step="any"
                min="0"
                value={acquiredPriceUsd}
                onChange={(event) => setAcquiredPriceUsd(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentFloorPriceUsd">{t('floorPriceLabel')}</Label>
              <Input
                id="currentFloorPriceUsd"
                type="number"
                step="any"
                min="0"
                value={currentFloorPriceUsd}
                onChange={(event) => setCurrentFloorPriceUsd(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acquiredAt">{t('acquiredAtLabel')}</Label>
            <Input
              id="acquiredAt"
              type="datetime-local"
              required
              value={acquiredAt}
              onChange={(event) => setAcquiredAt(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nftNotes">{t('notesLabel')}</Label>
            <Textarea
              id="nftNotes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('saving') : holding ? t('saveChanges') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
