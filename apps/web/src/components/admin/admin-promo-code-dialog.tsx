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
import { createAdminPromoCode } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import type { PaidPlan } from '@/types/billing';

const SELECT_CLASS =
  'border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

type AdminPromoCodeDialogProps = {
  children: ReactNode;
};

export function AdminPromoCodeDialog({ children }: AdminPromoCodeDialogProps) {
  const t = useTranslations('admin.promoCodes.dialog');
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [grantsPlan, setGrantsPlan] = useState<PaidPlan>('PREMIUM');
  const [freeDays, setFreeDays] = useState('30');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createAdminPromoCode({
        code: code.trim(),
        description: description.trim() || undefined,
        grantsPlan,
        freeDays: Number(freeDays),
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
        expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59.999Z`).toISOString() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminPromoCodes });
      setOpen(false);
      setCode('');
      setDescription('');
      setMaxRedemptions('');
      setExpiresAt('');
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : t('genericError')),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promoCode">{t('codeLabel')}</Label>
            <Input
              id="promoCode"
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="WELCOME30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promoDescription">{t('descriptionLabel')}</Label>
            <Input
              id="promoDescription"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="promoPlan">{t('planLabel')}</Label>
              <select
                id="promoPlan"
                value={grantsPlan}
                onChange={(event) => setGrantsPlan(event.target.value as PaidPlan)}
                className={SELECT_CLASS}
              >
                <option value="STANDARD">Standard</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="promoFreeDays">{t('freeDaysLabel')}</Label>
              <Input
                id="promoFreeDays"
                type="number"
                min={1}
                required
                value={freeDays}
                onChange={(event) => setFreeDays(event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="promoMaxRedemptions">{t('maxRedemptionsLabel')}</Label>
              <Input
                id="promoMaxRedemptions"
                type="number"
                min={1}
                value={maxRedemptions}
                onChange={(event) => setMaxRedemptions(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promoExpiresAt">{t('expiresAtLabel')}</Label>
              <Input
                id="promoExpiresAt"
                type="date"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
              />
            </div>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('creating') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
