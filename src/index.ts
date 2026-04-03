/**
 * Aya API - Quran Verse Service
 * 
 * Primary: quran.com API (with QUL translations & scripts)
 * Fallback: Bundled local data
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import fallbackData from './fallback-data.json';

const app = new Hono();

// CORS for public API
app.use('*', cors());

// ============================================================================
// TYPES
// ============================================================================

interface QuranComVerse {
  id: number;
  verse_key: string;
  text_uthmani: string;
  text_indopak?: string;
  page_number?: number;
  juz_number?: number;
  translations?: Array<{
    id: number;
    resource_id: number;
    text: string;
  }>;
}

interface AyaResponse {
  surah: number;
  surah_name: string;
  surah_name_en: string;
  surah_transliteration: string;
  ayah: number;
  text_arabic: string;
  script: string;
  translation: {
    id: string;
    name: string;
    text: string;
  };
  verse_key: string;
  page?: number;
  juz?: number;
  image_url?: string;
  source: 'api' | 'fallback';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TOTAL_VERSES = 6236;

// Arabic scripts available
const SCRIPTS: Record<string, string> = {
  uthmani: 'text_uthmani',
  indopak: 'text_indopak',
};

// English translations (quran.com resource IDs)
const TRANSLATIONS: Record<string, { id: number; name: string }> = {
  sahih: { id: 20, name: 'Saheeh International' },
  pickthall: { id: 19, name: 'M. Pickthall' },
  yusufali: { id: 22, name: 'A. Yusuf Ali' },
  haleem: { id: 85, name: 'M.A.S. Abdel Haleem' },
  hilali: { id: 203, name: 'Al-Hilali & Khan' },
  usmani: { id: 84, name: 'Mufti Taqi Usmani' },
  clearquran: { id: 131, name: 'The Clear Quran' },
};

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

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Strip HTML tags and footnote markers from translation text
 */
function cleanTranslationText(text: string): string {
  return text
    .replace(/<sup[^>]*>.*?<\/sup>/gi, '') // Remove footnote superscripts
    .replace(/<[^>]+>/g, '')                // Remove remaining HTML tags
    .replace(/\s+/g, ' ')                   // Normalize whitespace
    .trim();
}

/**
 * Get verse image URL from qurancdn
 */
function getImageUrl(pageNumber: number, surah: number, ayah: number): string {
  // QUL CDN has word-level images, but for verse-level we construct a reference
  // Format: verse images are available per page in different styles
  return `https://static.qurancdn.com/images/pages/v1/png/${pageNumber}.png`;
}

/**
 * Get verse from quran.com API with specified script and translation
 */
async function getFromAPI(
  surah: number,
  ayah: number,
  scriptKey: string = 'uthmani',
  translationKey: string = 'sahih'
): Promise<AyaResponse | null> {
  try {
    const verseKey = `${surah}:${ayah}`;
    const scriptField = SCRIPTS[scriptKey] || SCRIPTS.uthmani;
    const translation = TRANSLATIONS[translationKey] || TRANSLATIONS.sahih;
    
    // Build fields for Arabic scripts
    const fields = ['text_uthmani'];
    if (scriptKey === 'indopak') {
      fields.push('text_indopak');
    }
    
    const url = `https://api.qurancdn.com/api/qdc/verses/by_key/${verseKey}?translations=${translation.id}&fields=${fields.join(',')}`;
    
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!res.ok) return null;
    
    const data = await res.json() as { verse: QuranComVerse };
    const verse = data.verse;
    
    // Get Arabic text based on script
    let arabicText = verse.text_uthmani;
    if (scriptKey === 'indopak' && verse.text_indopak) {
      arabicText = verse.text_indopak;
    }
    
    // Get translation text
    let translationText = '';
    if (verse.translations && verse.translations.length > 0) {
      translationText = cleanTranslationText(verse.translations[0].text);
    }
    
    const chapterInfo = chapters[surah.toString()];
    
    const result: AyaResponse = {
      surah,
      surah_name: chapterInfo?.name || '',
      surah_name_en: chapterInfo?.translation || '',
      surah_transliteration: chapterInfo?.transliteration || '',
      ayah,
      text_arabic: arabicText,
      script: scriptKey,
      translation: {
        id: translationKey,
        name: translation.name,
        text: translationText || fallbackVerses.find(v => v.s === surah && v.v === ayah)?.e || ''
      },
      verse_key: verseKey,
      source: 'api'
    };
    
    // Add page/juz if available
    if (verse.page_number) {
      result.page = verse.page_number;
      result.image_url = getImageUrl(verse.page_number, surah, ayah);
    }
    if (verse.juz_number) {
      result.juz = verse.juz_number;
    }
    
    return result;
  } catch (e) {
    console.error('API fetch failed:', e);
    return null;
  }
}

/**
 * Get random verse from fallback data
 */
function getFromFallback(translationKey: string = 'sahih'): AyaResponse {
  const randomIndex = Math.floor(Math.random() * fallbackVerses.length);
  const verse = fallbackVerses[randomIndex];
  const chapterInfo = chapters[verse.s.toString()];
  const translation = TRANSLATIONS[translationKey] || TRANSLATIONS.sahih;
  
  return {
    surah: verse.s,
    surah_name: chapterInfo?.name || '',
    surah_name_en: chapterInfo?.translation || '',
    surah_transliteration: chapterInfo?.transliteration || '',
    ayah: verse.v,
    text_arabic: verse.a,
    script: 'uthmani',
    translation: {
      id: 'sahih',
      name: translation.name,
      text: verse.e
    },
    verse_key: `${verse.s}:${verse.v}`,
    source: 'fallback'
  };
}

/**
 * Get specific verse from fallback data
 */
function getSpecificFromFallback(surah: number, ayah: number, translationKey: string = 'sahih'): AyaResponse | null {
  const verse = fallbackVerses.find(v => v.s === surah && v.v === ayah);
  if (!verse) return null;
  
  const chapterInfo = chapters[surah.toString()];
  const translation = TRANSLATIONS[translationKey] || TRANSLATIONS.sahih;
  
  return {
    surah,
    surah_name: chapterInfo?.name || '',
    surah_name_en: chapterInfo?.translation || '',
    surah_transliteration: chapterInfo?.transliteration || '',
    ayah,
    text_arabic: verse.a,
    script: 'uthmani',
    translation: {
      id: 'sahih',
      name: translation.name,
      text: verse.e
    },
    verse_key: `${surah}:${ayah}`,
    source: 'fallback'
  };
}

// ============================================================================
// ROUTES
// ============================================================================

// Health check & API info
app.get('/', (c) => {
  return c.json({
    name: 'Aya API',
    description: 'Quran Verse Service with Multiple Translations & Scripts',
    version: '2.0.0',
    endpoints: {
      random: '/api/aya/random',
      specific: '/api/aya/:surah/:ayah',
      image: '/api/aya/:surah/:ayah/image',
      surah: '/api/surah/:id',
      translations: '/api/translations',
      scripts: '/api/scripts',
      info: '/api/info'
    },
    query_params: {
      script: Object.keys(SCRIPTS).join(' | '),
      translation: Object.keys(TRANSLATIONS).join(' | ')
    },
    source: 'https://github.com/iAhmadZain/aya-api'
  });
});

// List available translations
app.get('/api/translations', (c) => {
  return c.json({
    translations: Object.entries(TRANSLATIONS).map(([key, val]) => ({
      id: key,
      name: val.name,
      resource_id: val.id
    }))
  });
});

// List available scripts
app.get('/api/scripts', (c) => {
  return c.json({
    scripts: [
      { id: 'uthmani', name: 'Uthmani', description: 'Standard Uthmani script used in most Mushafs' },
      { id: 'indopak', name: 'IndoPak', description: 'Script style common in South Asian Mushafs' }
    ]
  });
});

// Random ayah - primary endpoint
// GET /api/aya/random?script=uthmani&translation=sahih
app.get('/api/aya/random', async (c) => {
  const script = c.req.query('script') || 'uthmani';
  const translation = c.req.query('translation') || 'sahih';
  
  // Pick a random verse
  const randomIndex = Math.floor(Math.random() * fallbackVerses.length);
  const randomVerse = fallbackVerses[randomIndex];
  
  // Try API first
  const apiResult = await getFromAPI(randomVerse.s, randomVerse.v, script, translation);
  
  if (apiResult) {
    return c.json(apiResult);
  }
  
  // Fallback to local data
  return c.json(getFromFallback(translation));
});

// Specific ayah
// GET /api/aya/:surah/:ayah?script=uthmani&translation=haleem
app.get('/api/aya/:surah/:ayah', async (c) => {
  const surah = parseInt(c.req.param('surah'));
  const ayah = parseInt(c.req.param('ayah'));
  const script = c.req.query('script') || 'uthmani';
  const translation = c.req.query('translation') || 'sahih';
  
  if (isNaN(surah) || isNaN(ayah) || surah < 1 || surah > 114) {
    return c.json({ error: 'Invalid surah or ayah number' }, 400);
  }
  
  // Try API first
  const apiResult = await getFromAPI(surah, ayah, script, translation);
  
  if (apiResult) {
    return c.json(apiResult);
  }
  
  // Fallback to local data
  const fallbackResult = getSpecificFromFallback(surah, ayah, translation);
  
  if (!fallbackResult) {
    return c.json({ error: 'Ayah not found' }, 404);
  }
  
  return c.json(fallbackResult);
});

// Image endpoint - returns image URL
// GET /api/aya/:surah/:ayah/image
app.get('/api/aya/:surah/:ayah/image', async (c) => {
  const surah = parseInt(c.req.param('surah'));
  const ayah = parseInt(c.req.param('ayah'));
  
  if (isNaN(surah) || isNaN(ayah) || surah < 1 || surah > 114) {
    return c.json({ error: 'Invalid surah or ayah number' }, 400);
  }
  
  // Fetch verse to get page number
  const verseKey = `${surah}:${ayah}`;
  
  try {
    const res = await fetch(
      `https://api.quran.com/api/v4/verses/by_key/${verseKey}?fields=page_number`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!res.ok) {
      return c.json({ error: 'Verse not found' }, 404);
    }
    
    const data = await res.json() as { verse: { page_number: number } };
    const pageNumber = data.verse.page_number;
    
    return c.json({
      surah,
      ayah,
      verse_key: verseKey,
      page: pageNumber,
      images: {
        // Page-level images (full page containing the verse)
        page_png: `https://static.qurancdn.com/images/pages/v1/png/${pageNumber}.png`,
        page_v2: `https://static.qurancdn.com/images/w/rq-color/page${pageNumber}.png`,
        // Word-by-word images CDN pattern
        words_base_url: `https://static.qurancdn.com/images/w/rq-color/${pageNumber}/`
      }
    });
  } catch (e) {
    return c.json({ error: 'Failed to fetch verse info' }, 500);
  }
});

// Get surah info and all verses
app.get('/api/surah/:id', async (c) => {
  const surahId = parseInt(c.req.param('id'));
  const script = c.req.query('script') || 'uthmani';
  const translation = c.req.query('translation') || 'sahih';
  
  if (isNaN(surahId) || surahId < 1 || surahId > 114) {
    return c.json({ error: 'Invalid surah number (1-114)' }, 400);
  }
  
  const chapterInfo = chapters[surahId.toString()];
  const translationInfo = TRANSLATIONS[translation] || TRANSLATIONS.sahih;
  
  // Try to fetch from API
  try {
    const scriptField = SCRIPTS[script] || SCRIPTS.uthmani;
    const url = `https://api.qurancdn.com/api/qdc/verses/by_chapter/${surahId}?translations=${translationInfo.id}&fields=${scriptField}&per_page=300`;
    
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (res.ok) {
      const data = await res.json() as { verses: QuranComVerse[] };
      
      const verses = data.verses.map((v: QuranComVerse) => {
        const [, ayahNum] = v.verse_key.split(':');
        let arabicText = v.text_uthmani;
        if (script === 'indopak' && v.text_indopak) {
          arabicText = v.text_indopak;
        }
        
        let translationText = '';
        if (v.translations && v.translations.length > 0) {
          translationText = cleanTranslationText(v.translations[0].text);
        }
        
        return {
          ayah: parseInt(ayahNum),
          text_arabic: arabicText,
          translation: translationText
        };
      });
      
      return c.json({
        surah: surahId,
        surah_name: chapterInfo?.name || '',
        surah_name_en: chapterInfo?.translation || '',
        surah_transliteration: chapterInfo?.transliteration || '',
        total_verses: chapterInfo?.total_verses || verses.length,
        script,
        translation: {
          id: translation,
          name: translationInfo.name
        },
        verses,
        source: 'api'
      });
    }
  } catch (e) {
    console.error('Surah API fetch failed:', e);
  }
  
  // Fallback to local data
  const verses = fallbackVerses
    .filter(v => v.s === surahId)
    .map(v => ({
      ayah: v.v,
      text_arabic: v.a,
      translation: v.e
    }));
  
  return c.json({
    surah: surahId,
    surah_name: chapterInfo?.name || '',
    surah_name_en: chapterInfo?.translation || '',
    surah_transliteration: chapterInfo?.transliteration || '',
    total_verses: chapterInfo?.total_verses || verses.length,
    script: 'uthmani',
    translation: {
      id: 'sahih',
      name: 'Saheeh International'
    },
    verses,
    source: 'fallback'
  });
});

// API info
app.get('/api/info', (c) => {
  return c.json({
    total_surahs: 114,
    total_verses: TOTAL_VERSES,
    sources: {
      primary: 'quran.com / qurancdn.com API',
      fallback: 'Bundled data (risan/quran-json)'
    },
    scripts: Object.keys(SCRIPTS),
    translations: Object.entries(TRANSLATIONS).map(([k, v]) => ({
      id: k,
      name: v.name
    })),
    features: [
      'Multiple Arabic scripts (Uthmani, IndoPak)',
      'Multiple English translations',
      'Page/Juz information',
      'Image URLs for verses'
    ]
  });
});

// Fallback only endpoint (for testing)
app.get('/api/aya/random/fallback', (c) => {
  return c.json(getFromFallback());
});

export default app;
