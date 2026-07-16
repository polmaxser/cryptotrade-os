'use client';

import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logoutRequest } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from '@/i18n/navigation';

function getInitials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

export function UserMenu() {
  const t = useTranslations('common');
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);

  if (status !== 'authenticated' || !user) {
    return null;
  }

  async function handleLogout() {
    await logoutRequest();
    clear();
    router.replace('/login');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('accountMenu')}
          className="rounded-full focus-visible:outline-none"
        >
          <Avatar className="ring-border/60 h-9 w-9 ring-1">
            <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-xs font-semibold text-violet-200">
              {getInitials(user.email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-muted-foreground max-w-[220px] truncate font-normal">
          {user.email}
        </DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => router.push('/journal')}>{t('journal')}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push('/calendar')}>
          {t('calendar')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push('/watchlist')}>
          {t('watchlist')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push('/alerts')}>{t('alerts')}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push('/notes')}>{t('notes')}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push('/exchanges')}>
          {t('exchanges')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push('/defi')}>{t('defi')}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push('/nft')}>{t('nft')}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push('/workspaces')}>
          {t('workspaces')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push('/settings')}>
          {t('settings')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push('/pricing')}>{t('pricing')}</DropdownMenuItem>
        <DropdownMenuItem onSelect={handleLogout}>{t('logout')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
