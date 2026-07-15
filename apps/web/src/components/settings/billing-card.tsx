'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from '@/components/dashboard/dashboard-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { createPortalSession, redeemPromoCode } from '@/lib/api/billing';
import { ApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import { useSubscriptionQuery } from '@/hooks/use-subscription-query';
import type { SubscriptionStatus } from '@/types/billing';

const STATUS_BADGE_VARIANT: Record<SubscriptionStatus, 'success' | 'secondary' | 'danger'> = {
  ACTIVE: 'success',
  TRIALING: 'secondary',
  PAST_DUE: 'danger',
  CANCELED: 'danger',
  INCOMPLETE: 'secondary',
};

export function BillingCard() {
  const t = useTranslations('settings.billing');
  const tStatus = useTranslations('settings.billing.status');
  const tErrors = useTranslations('auth.errors');
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useSubscriptionQuery();

  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const portalMutation = useMutation({
    mutationFn: createPortalSession,
    onSuccess: (session) => {
      window.location.href = session.url;
    },
    onError: (err) => setPortalError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  const promoMutation = useMutation({
    mutationFn: redeemPromoCode,
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEYS.subscription, updated);
      setPromoCode('');
      setPromoSuccess(true);
    },
    onError: (err) => setPromoError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  function handlePromoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPromoError(null);
    setPromoSuccess(false);
    promoMutation.mutate(promoCode);
  }

  if (isLoading || !subscription) {
    return null;
  }

  return (
    <DashboardCard>
      <DashboardCardHeader
        title={t('title')}
        description={t('description')}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_BADGE_VARIANT[subscription.status]}>
              {tStatus(subscription.status)}
            </Badge>
            <Badge variant="outline">{t(`plans.${subscription.plan}`)}</Badge>
          </div>
        }
      />
      <DashboardCardContent className="space-y-6 pt-4">
        <div className="space-y-4">
          <UsageRow
            label={t('usage.portfolios')}
            used={subscription.usage.portfolios}
            limit={subscription.limits.maxPortfolios}
            unlimitedLabel={t('usage.unlimited')}
          />
          <UsageRow
            label={t('usage.tradesThisMonth')}
            used={subscription.usage.tradesThisMonth}
            limit={subscription.limits.maxTradesPerMonth}
            unlimitedLabel={t('usage.unlimited')}
          />
        </div>

        {subscription.currentPeriodEnd ? (
          <p className="text-muted-foreground text-sm">
            {subscription.cancelAtPeriodEnd
              ? t('cancelsOn', {
                  date: new Date(subscription.currentPeriodEnd).toLocaleDateString(),
                })
              : t('renewsOn', {
                  date: new Date(subscription.currentPeriodEnd).toLocaleDateString(),
                })}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {subscription.plan !== 'PREMIUM' ? (
            <Button asChild size="sm">
              <Link href="/pricing">{t('viewPlans')}</Link>
            </Button>
          ) : null}
          {subscription.hasBillingAccount ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              {portalMutation.isPending ? t('openingPortal') : t('managePortal')}
            </Button>
          ) : null}
        </div>

        {portalError ? <p className="text-sm text-red-400">{portalError}</p> : null}

        <form onSubmit={handlePromoSubmit} className="space-y-2 border-t pt-4">
          <Label htmlFor="promoCode">{t('promoCode.label')}</Label>
          <div className="flex gap-2">
            <Input
              id="promoCode"
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value)}
              placeholder={t('promoCode.placeholder')}
              className="max-w-xs"
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={promoMutation.isPending || !promoCode.trim()}
            >
              {promoMutation.isPending ? t('promoCode.redeeming') : t('promoCode.submit')}
            </Button>
          </div>
          {promoError ? <p className="text-sm text-red-400">{promoError}</p> : null}
          {promoSuccess ? (
            <p className="text-sm text-emerald-400">{t('promoCode.success')}</p>
          ) : null}
        </form>
      </DashboardCardContent>
    </DashboardCard>
  );
}

type UsageRowProps = {
  label: string;
  used: number;
  limit: number | null;
  unlimitedLabel: string;
};

function UsageRow({ label, used, limit, unlimitedLabel }: UsageRowProps) {
  const percent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground/80">{label}</span>
        <span className="text-muted-foreground">
          {limit === null ? unlimitedLabel : `${used} / ${limit}`}
        </span>
      </div>
      {limit !== null ? <Progress value={percent} /> : null}
    </div>
  );
}
