// src/api/diary.ts
import type { Diary, DiaryInput } from '@/types/diary';

const API_BASE = '/api/diaries';
const UPLOAD_URL = '/api/upload';

export interface FetchParams {
  search?: string;
  tag?: string;
  startDate?: string;
  endDate?: string;
  isPublic?: boolean;
}

export async function fetchDiaries(params: FetchParams = {}): Promise<Diary[]> {
  const url = new URL(API_BASE, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Fetch failed');
  return res.json();
}

export async function createDiary(data: DiaryInput): Promise<Diary> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Create failed');
  return res.json();
}

export async function updateDiary(id: string, data: Partial<DiaryInput>): Promise<void> {
  const res = await fetch(`${API_BASE}?id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Update failed');
}

export async function deleteDiary(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url;
}

export async function fetchDiaryVersions(diaryId: string): Promise<Array<{
  id: string;
  title: string;
  content: string;
  created_at: string;
}>> {
  const res = await fetch(`/api/diaries/versions?id=${diaryId}`);
  if (!res.ok) throw new Error('Fetch versions failed');
  return res.json();
}