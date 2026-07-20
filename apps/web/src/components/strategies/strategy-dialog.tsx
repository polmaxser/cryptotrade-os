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
import { createStrategy, updateStrategy } from '@/lib/api/strategies';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import type { Strategy } from '@/types/strategy';

type StrategyDialogProps = {
  strategy?: Strategy;
  children: ReactNode;
};

export function StrategyDialog({ strategy, children }: StrategyDialogProps) {
  const t = useTranslations('strategies.dialog');
  const tErrors = useTranslations('auth.errors');
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(strategy?.name ?? '');
  const [timeframe, setTimeframe] = useState(strategy?.timeframe ?? '');
  const [description, setDescription] = useState(strategy?.description ?? '');
  const [entryCriteria, setEntryCriteria] = useState(strategy?.entryCriteria ?? '');
  const [exitCriteria, setExitCriteria] = useState(strategy?.exitCriteria ?? '');
  const [riskManagement, setRiskManagement] = useState(strategy?.riskManagement ?? '');
  const [isActive, setIsActive] = useState(strategy?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        timeframe: timeframe.trim() || undefined,
        description: description.trim() || undefined,
        entryCriteria: entryCriteria.trim() || undefined,
        exitCriteria: exitCriteria.trim() || undefined,
        riskManagement: riskManagement.trim() || undefined,
        isActive,
      };

      return strategy ? updateStrategy(strategy.id, payload) : createStrategy(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.strategies });
      setOpen(false);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen && !strategy) {
      setName('');
      setTimeframe('');
      setDescription('');
      setEntryCriteria('');
      setExitCriteria('');
      setRiskManagement('');
      setIsActive(true);
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
          <DialogTitle>{strategy ? t('editTitle') : t('createTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="strategyName">{t('nameLabel')}</Label>
              <Input
                id="strategyName"
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategyTimeframe">{t('timeframeLabel')}</Label>
              <Input
                id="strategyTimeframe"
                placeholder="1h, 4h, 1d..."
                maxLength={20}
                value={timeframe}
                onChange={(event) => setTimeframe(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategyDescription">{t('descriptionLabel')}</Label>
            <Textarea
              id="strategyDescription"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategyEntry">{t('entryCriteriaLabel')}</Label>
            <Textarea
              id="strategyEntry"
              value={entryCriteria}
              onChange={(event) => setEntryCriteria(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategyExit">{t('exitCriteriaLabel')}</Label>
            <Textarea
              id="strategyExit"
              value={exitCriteria}
              onChange={(event) => setExitCriteria(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategyRisk">{t('riskManagementLabel')}</Label>
            <Textarea
              id="strategyRisk"
              value={riskManagement}
              onChange={(event) => setRiskManagement(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('statusLabel')}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={isActive ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setIsActive(true)}
              >
                {t('active')}
              </Button>
              <Button
                type="button"
                variant={!isActive ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setIsActive(false)}
              >
                {t('inactive')}
              </Button>
            </div>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('saving') : strategy ? t('saveChanges') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
