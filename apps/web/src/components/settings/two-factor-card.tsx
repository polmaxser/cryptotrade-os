'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from '@/components/dashboard/dashboard-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  disableTwoFactorRequest,
  enableTwoFactorRequest,
  setupTwoFactorRequest,
} from '@/lib/api/auth';
import { ApiError } from '@/lib/api/errors';
import { useAuthStore } from '@/stores/auth-store';
import type { TwoFactorSetup } from '@/types/auth';

type Step = 'idle' | 'setup' | 'disable';

export function TwoFactorCard() {
  const t = useTranslations('settings.twoFactor');
  const tErrors = useTranslations('auth.errors');

  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [step, setStep] = useState<Step>('idle');
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const setupMutation = useMutation({
    mutationFn: setupTwoFactorRequest,
    onSuccess: (data) => {
      setSetupData(data);
      setStep('setup');
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  const enableMutation = useMutation({
    mutationFn: enableTwoFactorRequest,
    onSuccess: () => {
      if (user) setUser({ ...user, twoFactorEnabled: true });
      resetFlow();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  const disableMutation = useMutation({
    mutationFn: disableTwoFactorRequest,
    onSuccess: () => {
      if (user) setUser({ ...user, twoFactorEnabled: false });
      resetFlow();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : tErrors('generic')),
  });

  function resetFlow() {
    setStep('idle');
    setSetupData(null);
    setCode('');
    setError(null);
  }

  function handleEnableSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    enableMutation.mutate(code);
  }

  function handleDisableSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    disableMutation.mutate(code);
  }

  if (!user) return null;

  return (
    <DashboardCard>
      <DashboardCardHeader
        title={t('title')}
        description={t('description')}
        action={
          <Badge variant={user.twoFactorEnabled ? 'success' : 'secondary'}>
            {user.twoFactorEnabled ? t('statusEnabled') : t('statusDisabled')}
          </Badge>
        }
      />
      <DashboardCardContent className="space-y-4 pt-4">
        {step === 'idle' && !user.twoFactorEnabled ? (
          <Button onClick={() => setupMutation.mutate()} disabled={setupMutation.isPending}>
            {setupMutation.isPending ? t('settingUp') : t('enableButton')}
          </Button>
        ) : null}

        {step === 'idle' && user.twoFactorEnabled ? (
          <Button variant="outline" onClick={() => setStep('disable')}>
            {t('disableButton')}
          </Button>
        ) : null}

        {step === 'setup' && setupData ? (
          <form onSubmit={handleEnableSubmit} className="space-y-4">
            <p className="text-muted-foreground text-sm">{t('scanPrompt')}</p>

            <div className="flex justify-center">
              <Image
                src={setupData.qrCodeDataUrl}
                alt="2FA QR code"
                width={200}
                height={200}
                className="rounded-lg border"
                unoptimized
              />
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">{t('manualEntryLabel')}</p>
              <code className="bg-background/50 block break-all rounded-md border px-3 py-2 font-mono text-xs">
                {setupData.secret}
              </code>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enableCode">{t('codeLabel')}</Label>
              <Input
                id="enableCode"
                inputMode="numeric"
                maxLength={6}
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <div className="flex gap-2">
              <Button type="submit" disabled={enableMutation.isPending}>
                {enableMutation.isPending ? t('confirming') : t('confirmButton')}
              </Button>
              <Button type="button" variant="ghost" onClick={resetFlow}>
                {t('cancel')}
              </Button>
            </div>
          </form>
        ) : null}

        {step === 'disable' ? (
          <form onSubmit={handleDisableSubmit} className="space-y-4">
            <p className="text-muted-foreground text-sm">{t('disablePrompt')}</p>

            <div className="space-y-2">
              <Label htmlFor="disableCode">{t('codeLabel')}</Label>
              <Input
                id="disableCode"
                inputMode="numeric"
                maxLength={6}
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <div className="flex gap-2">
              <Button type="submit" variant="destructive" disabled={disableMutation.isPending}>
                {disableMutation.isPending ? t('confirming') : t('disableButton')}
              </Button>
              <Button type="button" variant="ghost" onClick={resetFlow}>
                {t('cancel')}
              </Button>
            </div>
          </form>
        ) : null}
      </DashboardCardContent>
    </DashboardCard>
  );
}
