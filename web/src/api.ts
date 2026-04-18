import type { AyaResponse, Translation, Script } from './types';

// Use explicit API origin so verse routes like /v/:surah/:ayah never break API calls
const API_BASE = 'https://api.getaya.live';

export async function getRandomAya(script = 'uthmani', translation = 'sahih'): Promise<AyaResponse> {
  const res = await fetch(`${API_BASE}/api/aya/random?script=${script}&translation=${translation}`);
  if (!res.ok) throw new Error('Failed to fetch random aya');
  return res.json();
}

export async function getAya(surah: number, ayah: number, script = 'uthmani', translation = 'sahih'): Promise<AyaResponse> {
  const res = await fetch(`${API_BASE}/api/aya/${surah}/${ayah}?script=${script}&translation=${translation}`);
  if (!res.ok) throw new Error('Failed to fetch aya');
  return res.json();
}

export async function getAyaWithWords(surah: number, ayah: number, script = 'uthmani', translation = 'sahih'): Promise<AyaResponse> {
  const res = await fetch(`${API_BASE}/api/aya/${surah}/${ayah}/words?script=${script}&translation=${translation}`);
  if (!res.ok) throw new Error('Failed to fetch aya with words');
  return res.json();
}

export async function getTranslations(): Promise<{ translations: Translation[] }> {
  const res = await fetch(`${API_BASE}/api/translations`);
  if (!res.ok) throw new Error('Failed to fetch translations');
  return res.json();
}

export async function getScripts(): Promise<{ scripts: Script[] }> {
  const res = await fetch(`${API_BASE}/api/scripts`);
  if (!res.ok) throw new Error('Failed to fetch scripts');
  return res.json();
}
