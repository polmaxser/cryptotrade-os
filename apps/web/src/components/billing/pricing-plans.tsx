'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createCheckoutSession } from '@/lib/api/billing';
import { ApiError } from '@/lib/api/errors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { usePlansQuery } from '@/hooks/use-plans-query';
import { useSubscriptionQuery } from '@/hooks/use-subscription-query';
import type { PaidPlan, SubscriptionPlan } from '@/types/billing';

function isPaidPlan(plan: SubscriptionPlan): plan is PaidPlan {
  return plan === 'STANDARD' || plan === 'PREMIUM';
}

export function PricingPlans() {
  const t = useTranslations('pricing');
  const tErrors = useTranslations('auth.errors');
  const router = useRouter();

  const status = useAuthStore((state) => state.status);
  const isAuthenticated = status === 'authenticated';

  const { data: plans, isLoading } = usePlansQuery();
  const { data: subscription } = useSubscriptionQuery(isAuthenticated);

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<PaidPlan | null>(null);

  const checkoutMutation = useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (session) => {
      window.location.href = session.url;
    },
    onError: (err) => {
      setCheckoutError(err instanceof ApiError ? err.message : tErrors('generic'));
      setPendingPlan(null);
    },
  });

  function handleUpgrade(plan: PaidPlan) {
    if (!isAuthenticated) {
      router.push('/register');
      return;
    }
    setCheckoutError(null);
    setPendingPlan(plan);
    checkoutMutation.mutate(plan);
  }

  if (isLoading || !plans) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = isAuthenticated && subscription?.plan === plan.plan;
          const highlighted = plan.plan === 'PREMIUM';

          return (
            <Card
              key={plan.plan}
              className={cn(
                'flex flex-col',
                highlighted && 'border-primary/60 shadow-primary/10 shadow-lg',
              )}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {isCurrent ? <Badge variant="success">{t('currentPlan')}</Badge> : null}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">
                    ${plan.priceMonthlyUsd}
                  </span>
                  <span className="text-muted-foreground text-sm">{t('perMonth')}</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-6">
                <ul className="flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isPaidPlan(plan.plan) ? (
                  <Button
                    className="w-full"
                    variant={highlighted ? 'default' : 'outline'}
                    disabled={
                      isCurrent || (checkoutMutation.isPending && pendingPlan === plan.plan)
                    }
                    onClick={() => handleUpgrade(plan.plan as PaidPlan)}
                  >
                    {checkoutMutation.isPending && pendingPlan === plan.plan
                      ? t('redirecting')
                      : isCurrent
                        ? t('currentPlan')
                        : t('upgradeButton')}
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    {isCurrent ? t('currentPlan') : t('includedByDefault')}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {checkoutError ? <p className="text-center text-sm text-red-400">{checkoutError}</p> : null}
    </div>
  );
}
