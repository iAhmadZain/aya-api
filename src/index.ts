/**
 * Aya API - Random Quran Verse Service
 * 
 * Primary: quran.com API
 * Fallback: Bundled local data
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import fallbackData from './fallback-data.json';

const app = new Hono();

// CORS for public API
app.use('*', cors());

// Types
interface QuranComVerse {
  id: number;
  verse_key: string;
  text_uthmani: string;
}

interface QuranComTranslation {
  resource_id: number;
  text: string;
}

interface AyaResponse {
  surah: number;
  surah_name: string;
  surah_name_en: string;
  surah_transliteration: string;
  ayah: number;
  text_arabic: string;
  text_english: string;
  verse_key: string;
  source: 'api' | 'fallback';
}

// Total verses in Quran
const TOTAL_VERSES = 6236;

// Chapter info from fallback data
const chapters = fallbackData.chapters as Record<string, {
  name: string;
  transliteration: string;
  translation: string;
  total_verses: number;
}>;

// Flat verses array for fallback
const fallbackVerses = fallbackData.verses as Array<{
  s: number;  // surah
  v: number;  // verse
  a: string;  // arabic
  e: string;  // english
}>;

/**
 * Get random verse from quran.com API
 */
async function getFromAPI(): Promise<AyaResponse | null> {
  try {
    // Pick a random verse from our fallback data to get valid surah:ayah
    const randomIndex = Math.floor(Math.random() * fallbackVerses.length);
    const randomVerse = fallbackVerses[randomIndex];
    const verseKey = `${randomVerse.s}:${randomVerse.v}`;
    
    // Fetch Arabic text using verse_key
    const arabicRes = await fetch(
      `https://api.quran.com/api/v4/verses/by_key/${verseKey}?fields=text_uthmani,verse_key`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!arabicRes.ok) return null;
    
    const arabicData = await arabicRes.json() as { verse: QuranComVerse };
    const surah = randomVerse.s;
    const ayah = randomVerse.v;
    
    // Use English from fallback data (quran.com translation API is unreliable)
    const englishText = randomVerse.e;
    
    const chapterInfo = chapters[surah.toString()];
    
    return {
      surah,
      surah_name: chapterInfo?.name || '',
      surah_name_en: chapterInfo?.translation || '',
      surah_transliteration: chapterInfo?.transliteration || '',
      ayah,
      text_arabic: arabicData.verse.text_uthmani,
      text_english: englishText,
      verse_key: verseKey,
      source: 'api'
    };
  } catch (e) {
    console.error('API fetch failed:', e);
    return null;
  }
}

/**
 * Get random verse from fallback data
 */
function getFromFallback(): AyaResponse {
  const randomIndex = Math.floor(Math.random() * fallbackVerses.length);
  const verse = fallbackVerses[randomIndex];
  const chapterInfo = chapters[verse.s.toString()];
  
  return {
    surah: verse.s,
    surah_name: chapterInfo?.name || '',
    surah_name_en: chapterInfo?.translation || '',
    surah_transliteration: chapterInfo?.transliteration || '',
    ayah: verse.v,
    text_arabic: verse.a,
    text_english: verse.e,
    verse_key: `${verse.s}:${verse.v}`,
    source: 'fallback'
  };
}

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'Aya API',
    description: 'Random Quran Verse Service',
    version: '1.0.0',
    endpoints: {
      random: '/api/aya/random',
      specific: '/api/aya/:surah/:ayah',
      surah: '/api/surah/:id',
      info: '/api/info'
    },
    source: 'https://github.com/iAhmadZain/aya-api'
  });
});

// Random ayah - primary endpoint
app.get('/api/aya/random', async (c) => {
  // Try API first
  const apiResult = await getFromAPI();
  
  if (apiResult) {
    return c.json(apiResult);
  }
  
  // Fallback to local data
  return c.json(getFromFallback());
});

// Specific ayah
app.get('/api/aya/:surah/:ayah', (c) => {
  const surah = parseInt(c.req.param('surah'));
  const ayah = parseInt(c.req.param('ayah'));
  
  if (isNaN(surah) || isNaN(ayah) || surah < 1 || surah > 114) {
    return c.json({ error: 'Invalid surah or ayah number' }, 400);
  }
  
  const verse = fallbackVerses.find(v => v.s === surah && v.v === ayah);
  
  if (!verse) {
    return c.json({ error: 'Ayah not found' }, 404);
  }
  
  const chapterInfo = chapters[surah.toString()];
  
  return c.json({
    surah,
    surah_name: chapterInfo?.name || '',
    surah_name_en: chapterInfo?.translation || '',
    surah_transliteration: chapterInfo?.transliteration || '',
    ayah,
    text_arabic: verse.a,
    text_english: verse.e,
    verse_key: `${surah}:${ayah}`,
    source: 'fallback'
  });
});

// Get surah info and all verses
app.get('/api/surah/:id', (c) => {
  const surahId = parseInt(c.req.param('id'));
  
  if (isNaN(surahId) || surahId < 1 || surahId > 114) {
    return c.json({ error: 'Invalid surah number (1-114)' }, 400);
  }
  
  const chapterInfo = chapters[surahId.toString()];
  const verses = fallbackVerses
    .filter(v => v.s === surahId)
    .map(v => ({
      ayah: v.v,
      text_arabic: v.a,
      text_english: v.e
    }));
  
  return c.json({
    surah: surahId,
    surah_name: chapterInfo?.name || '',
    surah_name_en: chapterInfo?.translation || '',
    surah_transliteration: chapterInfo?.transliteration || '',
    total_verses: chapterInfo?.total_verses || verses.length,
    verses
  });
});

// API info
app.get('/api/info', (c) => {
  return c.json({
    total_surahs: 114,
    total_verses: TOTAL_VERSES,
    sources: {
      primary: 'quran.com API',
      fallback: 'Bundled data (risan/quran-json)'
    },
    translations: {
      english: 'Sahih International'
    }
  });
});

// Fallback only endpoint (for testing)
app.get('/api/aya/random/fallback', (c) => {
  return c.json(getFromFallback());
});

export default app;
