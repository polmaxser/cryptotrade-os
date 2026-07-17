export interface ReportPeriod {
  from: Date;
  to: Date;
}

/** The UTC calendar day containing `reference`. */
export function dailyPeriod(reference: Date): ReportPeriod {
  const from = new Date(
    Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()),
  );
  return { from, to: new Date(from.getTime() + 24 * 60 * 60 * 1000) };
}

/** The Mon–Sun UTC week containing `reference`. */
export function weeklyPeriod(reference: Date): ReportPeriod {
  const dayOfWeek = reference.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(
    Date.UTC(
      reference.getUTCFullYear(),
      reference.getUTCMonth(),
      reference.getUTCDate() - daysSinceMonday,
    ),
  );
  return { from: monday, to: new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000) };
}

/** The UTC calendar month containing `reference`. */
export function monthlyPeriod(reference: Date): ReportPeriod {
  const from = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));
  const to = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 1));
  return { from, to };
}

/**
 * The immediately preceding WEEKLY or MONTHLY period, used for comparison.
 * Deliberately not a generic "shift by (to - from)" — months vary from 28 to
 * 31 days, so a fixed-duration shift back from a 31-day month lands a day
 * short of the true previous calendar month. Each type re-derives its
 * previous period from a shifted reference date instead.
 */
export function previousPeriod(type: 'WEEKLY' | 'MONTHLY', period: ReportPeriod): ReportPeriod {
  if (type === 'WEEKLY') {
    return weeklyPeriod(new Date(period.from.getTime() - 7 * 24 * 60 * 60 * 1000));
  }

  const previousMonthReference = new Date(
    Date.UTC(period.from.getUTCFullYear(), period.from.getUTCMonth() - 1, 1),
  );
  return monthlyPeriod(previousMonthReference);
}
