import type { CoachInsight, CoachInsightStatus } from '@/types/coach-insight';
import { apiFetch } from './client';

export async function fetchCoachInsights(status?: CoachInsightStatus): Promise<CoachInsight[]> {
  const query = status ? `?status=${status}` : '';
  return apiFetch<CoachInsight[]>(`/ai-coach/insights${query}`);
}

export async function updateCoachInsightStatus(
  id: string,
  status: Extract<CoachInsightStatus, 'CONFIRMED' | 'DISMISSED'>,
): Promise<CoachInsight> {
  return apiFetch<CoachInsight>(`/ai-coach/insights/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function analyzeNow(): Promise<CoachInsight[]> {
  return apiFetch<CoachInsight[]>('/ai-coach/insights/analyze', { method: 'POST' });
}
