import type { DashboardData } from '@/types/dashboard';
import { PLACEHOLDER_DASHBOARD_DATA } from './placeholder-data';

/**
 * Fetch dashboard data. Currently returns placeholder data.
 * Wire to `GET /api/v1/dashboard` when the backend endpoint is available.
 */
export async function getDashboardData(): Promise<DashboardData> {
  return PLACEHOLDER_DASHBOARD_DATA;
}
