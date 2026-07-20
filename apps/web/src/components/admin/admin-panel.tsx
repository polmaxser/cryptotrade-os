'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { AdminUsersTab } from './admin-users-tab';
import { AdminPromoCodesTab } from './admin-promo-codes-tab';
import { AdminEconomicEventsTab } from './admin-economic-events-tab';

type AdminTab = 'users' | 'promoCodes' | 'economicEvents';

const TABS: AdminTab[] = ['users', 'promoCodes', 'economicEvents'];

export function AdminPanel() {
  const t = useTranslations('admin');
  const [tab, setTab] = useState<AdminTab>('users');

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">{t('subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tabKey) => (
          <Button
            key={tabKey}
            size="sm"
            variant={tab === tabKey ? 'default' : 'outline'}
            onClick={() => setTab(tabKey)}
          >
            {t(`tabs.${tabKey}`)}
          </Button>
        ))}
      </div>

      {tab === 'users' ? <AdminUsersTab /> : null}
      {tab === 'promoCodes' ? <AdminPromoCodesTab /> : null}
      {tab === 'economicEvents' ? <AdminEconomicEventsTab /> : null}
    </div>
  );
}
