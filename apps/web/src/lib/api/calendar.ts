import type { CalendarDaySummary } from '@/types/calendar';
import { apiFetch } from './client';

export async function fetchCalendarMonth(month: string): Promise<CalendarDaySummary[]> {
  return apiFetch<CalendarDaySummary[]>(`/calendar?month=${encodeURIComponent(month)}`);
}
