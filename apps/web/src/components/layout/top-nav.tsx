'use client';

import { CandlestickChart, ChevronDown, LineChart, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  labelKey: string;
};

type NavGroup = {
  key: string;
  icon: typeof Wallet;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'portfolio',
    icon: Wallet,
    items: [
      { href: '/trades', labelKey: 'trades' },
      { href: '/exchanges', labelKey: 'exchanges' },
      { href: '/calendar', labelKey: 'calendar' },
      { href: '/defi', labelKey: 'defi' },
      { href: '/nft', labelKey: 'nft' },
    ],
  },
  {
    key: 'analytics',
    icon: LineChart,
    items: [
      { href: '/journal', labelKey: 'journal' },
      { href: '/notes', labelKey: 'notes' },
      { href: '/coach', labelKey: 'coach' },
      { href: '/reports', labelKey: 'reports' },
      { href: '/strategies', labelKey: 'strategies' },
      { href: '/backtests', labelKey: 'backtests' },
    ],
  },
  {
    key: 'markets',
    icon: CandlestickChart,
    items: [
      { href: '/charts', labelKey: 'charts' },
      { href: '/watchlist', labelKey: 'watchlist' },
      { href: '/alerts', labelKey: 'alerts' },
      { href: '/economic-calendar', labelKey: 'economicCalendar' },
    ],
  },
];

const TRIGGER_CLASS =
  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none';

export function TopNav() {
  const t = useTranslations('common');
  const tNav = useTranslations('nav');
  const status = useAuthStore((state) => state.status);
  const router = useRouter();
  const pathname = usePathname();

  if (status !== 'authenticated') {
    return null;
  }

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {NAV_GROUPS.map((group) => {
        const Icon = group.icon;
        const isActive = group.items.some((item) => pathname.startsWith(item.href));

        return (
          <DropdownMenu key={group.key}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  TRIGGER_CLASS,
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {tNav(group.key)}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[200px]">
              {group.items.map((item) => (
                <DropdownMenuItem key={item.href} onSelect={() => router.push(item.href)}>
                  {t(item.labelKey)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
      <button
        type="button"
        onClick={() => router.push('/workspaces')}
        className={cn(
          TRIGGER_CLASS,
          pathname.startsWith('/workspaces')
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
        )}
      >
        {t('workspaces')}
      </button>
    </nav>
  );
}
