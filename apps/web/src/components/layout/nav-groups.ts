import { CandlestickChart, LineChart, Wallet } from 'lucide-react';

export type NavItem = {
  href: string;
  labelKey: string;
};

export type NavGroup = {
  key: string;
  icon: typeof Wallet;
  items: NavItem[];
};

/** Shared between the desktop dropdown nav and the mobile sheet nav — one list, no drift. */
export const NAV_GROUPS: NavGroup[] = [
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
      { href: '/market-overview', labelKey: 'marketOverview' },
      { href: '/charts', labelKey: 'charts' },
      { href: '/watchlist', labelKey: 'watchlist' },
      { href: '/alerts', labelKey: 'alerts' },
      { href: '/economic-calendar', labelKey: 'economicCalendar' },
    ],
  },
];
