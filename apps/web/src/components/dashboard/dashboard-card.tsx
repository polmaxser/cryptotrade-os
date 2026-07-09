import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
};

export function DashboardCard({ children, className }: DashboardCardProps) {
  return (
    <div
      className={cn(
        'border-border/60 bg-card/40 shadow-card rounded-2xl border backdrop-blur-xl',
        className,
      )}
    >
      {children}
    </div>
  );
}

type DashboardCardHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function DashboardCardHeader({
  title,
  description,
  action,
  className,
}: DashboardCardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 p-5 pb-0 sm:p-6 sm:pb-0', className)}>
      <div className="space-y-1">
        <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {title}
        </h3>
        {description ? <p className="text-foreground/80 text-sm">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

type DashboardCardContentProps = {
  children: ReactNode;
  className?: string;
};

export function DashboardCardContent({ children, className }: DashboardCardContentProps) {
  return <div className={cn('p-5 sm:p-6', className)}>{children}</div>;
}
