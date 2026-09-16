'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { NAV_GROUPS } from './nav-groups';

const LINK_CLASS =
  'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none';

export function MobileNav() {
  const t = useTranslations('common');
  const tNav = useTranslations('nav');
  const status = useAuthStore((state) => state.status);
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (status !== 'authenticated') {
    return null;
  }

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t('openMenu')}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>{t('appName')}</SheetTitle>

        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.key} className="space-y-1">
              <p className="text-muted-foreground px-3 text-xs font-medium uppercase tracking-wide">
                {tNav(group.key)}
              </p>
              {group.items.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => navigate(item.href)}
                  className={cn(
                    LINK_CLASS,
                    'w-full text-left',
                    pathname.startsWith(item.href)
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                  )}
                >
                  {t(item.labelKey)}
                </button>
              ))}
            </div>
          ))}

          <div className="border-border/60 space-y-1 border-t pt-4">
            <button
              type="button"
              onClick={() => navigate('/workspaces')}
              className={cn(
                LINK_CLASS,
                'w-full text-left',
                pathname.startsWith('/workspaces')
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              )}
            >
              {t('workspaces')}
            </button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
