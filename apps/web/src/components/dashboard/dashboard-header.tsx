import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export async function DashboardHeader() {
  const t = await getTranslations('common');

  return (
    <header className="border-border/60 bg-background/70 sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-primary/10 ring-border/60 flex h-9 w-9 items-center justify-center rounded-xl ring-1">
            <Image src="/logo.svg" alt="" width={20} height={20} className="h-5 w-5" />
          </div>
          <span className="text-base font-semibold tracking-tight">{t('appName')}</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <LocaleSwitcher />
          <ThemeToggle />
          <Avatar className="ring-border/60 h-9 w-9 ring-1">
            <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-xs font-semibold text-violet-200">
              CT
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
