import type { ReactNode } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
