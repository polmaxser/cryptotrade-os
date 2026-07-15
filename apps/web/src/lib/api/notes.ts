import type { CreateNotePayload, Note, UpdateNotePayload } from '@/types/note';
import { apiFetch } from './client';

export async function fetchNotes(): Promise<Note[]> {
  return apiFetch<Note[]>('/notes');
}

export async function createNote(payload: CreateNotePayload): Promise<Note> {
  return apiFetch<Note>('/notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateNote(id: string, payload: UpdateNotePayload): Promise<Note> {
  return apiFetch<Note>(`/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteNote(id: string): Promise<void> {
  await apiFetch(`/notes/${id}`, { method: 'DELETE' });
}
