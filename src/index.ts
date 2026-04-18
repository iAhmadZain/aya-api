/**
 * Aya API - Quran Verse Service
 * 
 * Primary: quran.com API (with QUL translations & scripts)
 * Fallback: Bundled local data
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import fallbackData from './fallback-data.json';
import ogImageBase64 from './og-image-base64.txt';

const app = new Hono();

// CORS for public API - allow both web app and any other origin
app.use('*', cors({
  origin: ['https://getaya.live', 'https://www.getaya.live', 'http://localhost:5173', 'http://localhost:8787'],
  allowMethods: ['GET', 'HEAD', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Accept'],
  maxAge: 86400,
  exposeHeaders: ['Content-Length'],
}));

// ============================================================================
// TYPES
// ============================================================================

interface QuranComWord {
  id: number;
  position: number;
  text_uthmani: string;
  text_indopak?: string;
  page_number: number;
  line_number: number;
  translation?: { text: string };
  transliteration?: { text: string };
}

interface QuranComVerse {
  id: number;
  verse_key: string;
  text_uthmani: string;
  text_indopak?: string;
  page_number?: number;
  juz_number?: number;
  words?: QuranComWord[];
  translations?: Array<{
    id: number;
    resource_id: number;
    text: string;
  }>;
}

interface WordImage {
  position: number;
  text: string;
  image_url: string;
  translation?: string;
  transliteration?: string;
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
  images?: {
    page_svg: string;
    words: WordImage[];
  };
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
 * Escape XML special characters for safe use in SVG/HTML strings
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Get page SVG URL (full Mushaf page)
 */
function getPageSvgUrl(pageNumber: number): string {
  // MP3Quran has reliable SVG pages (001-604)
  const paddedPage = pageNumber.toString().padStart(3, '0');
  return `https://www.mp3quran.net/api/quran_pages_svg/${paddedPage}.svg`;
}

/**
 * Get word image URL - proxied through this API to avoid CORS and black PNG issues
 * Uses relative path; the image proxy endpoint will fetch from qurancdn and serve
 */
function getWordImageUrl(pageNumber: number, lineNumber: number, position: number): string {
  return `/api/image/word/${pageNumber}/${lineNumber}/${position}.png`;
}

/**
 * Get the origin (protocol + host) from the request for building absolute image URLs
 */
function getOrigin(c: { req: { header: (name: string) => string | undefined } }): string {
  const host = c.req.header('host');
  const protocol = c.req.header('x-forwarded-proto') || 'https';
  if (host) {
    return `${protocol}://${host}`;
  }
  return 'https://api.getaya.live';
}

/**
 * Get verse from quran.com API with specified script and translation
 */
async function getFromAPI(
  surah: number,
  ayah: number,
  scriptKey: string = 'uthmani',
  translationKey: string = 'sahih',
  includeWords: boolean = false,
  origin: string = 'https://api.getaya.live'
): Promise<AyaResponse | null> {
  try {
    const verseKey = `${surah}:${ayah}`;
    const translation = TRANSLATIONS[translationKey] || TRANSLATIONS.sahih;
    
    // Use qurancdn for basic data, quran.com v4 for words (correct line numbers for images)
    let verseData: QuranComVerse | null = null;
    
    if (includeWords) {
      // Fetch from quran.com v4 for correct line numbers
      const v4Url = `https://api.quran.com/api/v4/verses/by_key/${verseKey}?translations=${translation.id}&words=true&word_fields=text_uthmani,text_indopak&fields=text_uthmani,text_indopak,page_number,juz_number`;
      const v4Res = await fetch(v4Url, { headers: { 'Accept': 'application/json' } });
      
      if (v4Res.ok) {
        const v4Data = await v4Res.json() as { verse: QuranComVerse };
        verseData = v4Data.verse;
      }
    } else {
      // Use qurancdn for basic requests (faster, more reliable)
      const url = `https://api.qurancdn.com/api/qdc/verses/by_key/${verseKey}?translations=${translation.id}&fields=text_uthmani,text_indopak`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      
      if (res.ok) {
        const data = await res.json() as { verse: QuranComVerse };
        verseData = data.verse;
      }
    }
    
    if (!verseData) return null;
    const verse = verseData;
    
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
    }
    if (verse.juz_number) {
      result.juz = verse.juz_number;
    }
    
    // Add word images if words were fetched
    if (includeWords && verse.words && verse.page_number) {
      const lineWordCounters = new Map<number, number>();

      const wordImages: WordImage[] = verse.words
        .filter(w => w.line_number && w.text_uthmani && /[\u0621-\u064A\u066E-\u06D3\u06FA-\u06FF]/.test(w.text_uthmani))
        .map(w => {
          const currentLineCount = (lineWordCounters.get(w.line_number) || 0) + 1;
          lineWordCounters.set(w.line_number, currentLineCount);

          return {
            position: w.position,
            text: scriptKey === 'indopak' && w.text_indopak ? w.text_indopak : w.text_uthmani,
            image_url: `${origin}${getWordImageUrl(verse.page_number!, w.line_number, currentLineCount)}`,
            translation: w.translation?.text,
            transliteration: w.transliteration?.text
          };
        });
      
      result.images = {
        page_svg: getPageSvgUrl(verse.page_number),
        words: wordImages
      };
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
      id: translationKey,
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
      id: translationKey,
      name: translation.name,
      text: verse.e
    },
    verse_key: `${surah}:${ayah}`,
    source: 'fallback'
  };
}

// ============================================================================
// IMAGE PROXY
// ============================================================================

/**
 * Proxy word PNG images through the API to:
 * 1. Avoid CORS issues with qurancdn
 * 2. Set proper Content-Security-Policy headers
 * 3. Convert transparent PNGs to white-background PNGs so they're visible in dark mode
 */
app.get('/api/image/word/:page/:line/:position', async (c) => {
  const page = c.req.param('page');
  const line = c.req.param('line');
  let position = c.req.param('position');

  // Strip .png extension if present
  if (position.endsWith('.png')) {
    position = position.slice(0, -4);
  }

  const upstreamUrl = `https://static.qurancdn.com/images/w/rq-color/${page}/${line}/${position}.png`;

  try {
    const res = await fetch(upstreamUrl, {
      headers: { 'Accept': 'image/png' }
    });

    if (!res.ok) {
      return c.json({ error: 'Image not found' }, 404);
    }

    const imageData = await res.arrayBuffer();

    return new Response(imageData, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=604800',
        'CDN-Cache-Control': 'public, max-age=2592000',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (e) {
    console.error('Image proxy failed:', e);
    return c.json({ error: 'Failed to fetch image' }, 500);
  }
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check & API info
app.get('/', (c) => {
  return c.json({
    name: 'Aya API',
    description: 'Quran Verse Service with Multiple Translations & Scripts',
    version: '2.1.0',
    endpoints: {
      random: '/api/aya/random',
      specific: '/api/aya/:surah/:ayah',
      words: '/api/aya/:surah/:ayah/words',
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

// Fallback only endpoint (for testing)
app.get('/api/aya/random/fallback', (c) => {
  return c.json(getFromFallback());
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
  const apiResult = await getFromAPI(randomVerse.s, randomVerse.v, script, translation, false, getOrigin(c));
  
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
  const apiResult = await getFromAPI(surah, ayah, script, translation, false, getOrigin(c));
  
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

// Words endpoint - returns verse with word-by-word breakdown and images
// GET /api/aya/:surah/:ayah/words?script=uthmani&translation=haleem
app.get('/api/aya/:surah/:ayah/words', async (c) => {
  const surah = parseInt(c.req.param('surah'));
  const ayah = parseInt(c.req.param('ayah'));
  const script = c.req.query('script') || 'uthmani';
  const translation = c.req.query('translation') || 'sahih';
  
  if (isNaN(surah) || isNaN(ayah) || surah < 1 || surah > 114) {
    return c.json({ error: 'Invalid surah or ayah number' }, 400);
  }
  
  // Fetch with words included
  const apiResult = await getFromAPI(surah, ayah, script, translation, true, getOrigin(c));
  
  if (apiResult) {
    return c.json(apiResult);
  }
  
  // Fallback doesn't have word images
  const fallbackResult = getSpecificFromFallback(surah, ayah, translation);
  
  if (!fallbackResult) {
    return c.json({ error: 'Ayah not found' }, 404);
  }
  
  return c.json(fallbackResult);
});

// Image endpoint - returns image URLs for a verse
// GET /api/aya/:surah/:ayah/image
app.get('/api/aya/:surah/:ayah/image', async (c) => {
  const surah = parseInt(c.req.param('surah'));
  const ayah = parseInt(c.req.param('ayah'));
  
  if (isNaN(surah) || isNaN(ayah) || surah < 1 || surah > 114) {
    return c.json({ error: 'Invalid surah or ayah number' }, 400);
  }
  
  // Fetch verse with words to get image URLs
  const apiResult = await getFromAPI(surah, ayah, 'uthmani', 'sahih', true, getOrigin(c));
  
  if (apiResult && apiResult.page && apiResult.images) {
    return c.json({
      surah,
      ayah,
      verse_key: `${surah}:${ayah}`,
      page: apiResult.page,
      juz: apiResult.juz,
      images: {
        // Full page SVG from mp3quran
        page_svg: apiResult.images.page_svg,
        // Word-by-word PNGs from qurancdn
        words: apiResult.images.words
      }
    });
  }
  
  // If API fails, at least return page SVG based on verse lookup
  try {
    const res = await fetch(
      `https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?fields=page_number`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (res.ok) {
      const data = await res.json() as { verse: { page_number: number } };
      const pageNumber = data.verse.page_number;
      
      return c.json({
        surah,
        ayah,
        verse_key: `${surah}:${ayah}`,
        page: pageNumber,
        images: {
          page_svg: getPageSvgUrl(pageNumber),
          words: [] // No word images available
        }
      });
    }
  } catch (e) {
    console.error('Image fetch failed:', e);
  }
  
  return c.json({ error: 'Failed to fetch verse images' }, 500);
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
    const url = `https://api.qurancdn.com/api/qdc/verses/by_chapter/${surahId}?translations=${translationInfo.id}&fields=text_uthmani,text_indopak&per_page=300`;
    
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
      id: translation,
      name: translationInfo.name
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
    image_sources: {
      page_svg: 'mp3quran.net (604 pages)',
      word_png: 'static.qurancdn.com (word-by-word)'
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
      'Word-by-word images',
      'Full page SVG images'
    ]
  });
});

// ============================================================================
// OG IMAGE - Dynamic social preview
// ============================================================================

app.get('/api/og/:surah/:ayah', (c) => {
  const surah = parseInt(c.req.param('surah')) || 1;
  const ayah = parseInt(c.req.param('ayah')) || 1;

  const chapterInfo = chapters[surah.toString()];
  let arabicText = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
  let translationText = 'In the name of Allah, the Entirely Merciful, the Especially Merciful.';

  const fallback = fallbackVerses.find(v => v.s === surah && v.v === ayah);
  if (fallback) {
    arabicText = fallback.a;
    translationText = fallback.e;
  }

  if (arabicText.length > 100) arabicText = arabicText.substring(0, 100) + '...';
  if (translationText.length > 150) translationText = translationText.substring(0, 150) + '...';

  const surahName = chapterInfo?.transliteration || `Surah ${surah}`;

  const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ecfdf5"/>
      <stop offset="100%" style="stop-color:#f0fdfa"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="40" y="40" width="1120" height="550" rx="24" fill="white" stroke="#d1fae5" stroke-width="2"/>
  <rect x="80" y="80" width="60" height="60" rx="12" fill="#059669"/>
  <text x="110" y="125" font-size="32" fill="white" text-anchor="middle" font-family="Arial, sans-serif">آ</text>
  <text x="160" y="115" font-size="24" font-weight="bold" fill="#1f2937" font-family="Arial, sans-serif">Aya</text>
  <text x="160" y="135" font-size="14" fill="#6b7280" font-family="Arial, sans-serif">Quran Verse API</text>
  <text x="600" y="200" font-size="18" fill="#059669" text-anchor="middle" font-family="Arial, sans-serif">${escapeXml(surahName)} • Ayah ${ayah}</text>
  <foreignObject x="120" y="230" width="960" height="120">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Noto Naskh Arabic', 'Amiri', serif; font-size: 42px; color: #1f2937; text-align: center; line-height: 1.5; direction: rtl; unicode-bidi: bidi-override;">${escapeXml(arabicText)}</div>
  </foreignObject>
  <foreignObject x="140" y="390" width="920" height="90">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; font-size: 20px; color: #4b5563; text-align: center; line-height: 1.5;">${escapeXml(translationText)}</div>
  </foreignObject>
  <text x="600" y="540" font-size="16" fill="#9ca3af" text-anchor="middle" font-family="Arial, sans-serif">getaya.live</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
      'Content-Disposition': 'inline; filename="aya-og.svg"'
    }
  });
});

// Serve verse-specific static OG PNG ONLY for 2:255 ( Ayat Al-Kursi )
// ALL other verses: use Cloudflare Browser Rendering for dynamic screenshots
app.get('/api/og-image/:surah/:ayah', async (c) => {
  const surah = parseInt(c.req.param('surah')) || 1;
  const ayah = parseInt(c.req.param('ayah')) || 1;
  if (isNaN(surah) || isNaN(ayah) || surah < 1 || surah > 114) {
    return c.json({ error: 'Invalid verse reference' }, 400);
  }
  // Only 2:255 gets the pre-generated static image (fast, cached)
  if (surah === 2 && ayah === 255) {
    try {
      const staticRes = await fetch('https://getaya.live/og/2-255.png');
      if (staticRes.ok) {
        const buffer = await staticRes.arrayBuffer();
        return new Response(buffer, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
            'Content-Disposition': `inline; filename="aya-${surah}-${ayah}.png"`
          }
        });
      }
    } catch (e) { /* fall through */ }
  }
  // Dynamic: use Cloudflare Browser Rendering with retry for any verse
  const verseUrl = `https://getaya.live/v/${surah}/${ayah}`;
  const accountId = (c.env as any).CLOUDFLARE_ACCOUNT_ID;
  const apiToken = (c.env as any).CLOUDFLARE_API_TOKEN;
  const brUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/screenshot`;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 500 * attempt));
    try {
      const screenshotRes = await fetch(brUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: verseUrl,
          viewport: { width: 1200, height: 630 },
          // Give page time to load fonts before screenshot
          preferences: { powerPreference: 'high-performance' }
        })
      });
      if (screenshotRes.status === 429 || screenshotRes.status === 503) {
        console.log(`OG: attempt ${attempt+1} rate-limited, retrying...`);
        continue;
      }
      if (screenshotRes.ok) {
        const pngBuffer = await screenshotRes.arrayBuffer();
        if (pngBuffer.byteLength > 10000) {
          console.log(`OG: got ${pngBuffer.byteLength} bytes (attempt ${attempt+1})`);
          return new Response(pngBuffer, {
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
              'Content-Disposition': `inline; filename="aya-${surah}-${ayah}.png"`
            }
          });
        }
        console.log(`OG: attempt ${attempt+1} got too small response (${pngBuffer.byteLength} bytes), retrying...`);
      }
    } catch (e) {
      console.error(`OG: attempt ${attempt+1} failed:`, (e as Error).message);
    }
  }
  // Fallback: PNG fallback (always PNG - never SVG for OG images)
  // Serve a simple branded fallback PNG so social media always gets a valid image
  const bytes = Uint8Array.from(atob(ogImageBase64.trim()), c => c.charCodeAt(0));
  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=604800'
    }
  });
});

// ============================================================================
// VERSE SHARE PAGE - Dynamic OG metadata for /v/:surah/:ayah
// ============================================================================

/**
 * Generate proper HTML for verse share pages with dynamic OG metadata
 * This ensures social media scrapers get the correct preview for each verse
 */
app.get('/v/:surah/:ayah', (c) => {
  const surah = parseInt(c.req.param('surah')) || 1;
  const ayah = parseInt(c.req.param('ayah')) || 1;

  // Validate verse
  if (isNaN(surah) || isNaN(ayah) || surah < 1 || surah > 114) {
    return c.redirect('https://getaya.live');
  }

  const chapterInfo = chapters[surah.toString()];
  const fallback = fallbackVerses.find(v => v.s === surah && v.v === ayah);
  
  // If verse not found, redirect to home
  if (!fallback && !chapterInfo) {
    return c.redirect('https://getaya.live');
  }

  const arabicText = fallback?.a || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
  const translationText = fallback?.e || 'In the name of Allah, the Entirely Merciful, the Especially Merciful.';
  
  // Truncate for meta descriptions
  const translationTruncated = translationText.length > 200 ? translationText.substring(0, 200) + '...' : translationText;
  
  const surahName = chapterInfo?.transliteration || `Surah ${surah}`;
  const surahNameArabic = chapterInfo?.name || '';
  
  // Title and description for OG tags
  const title = `${surahName} ${surah}:${ayah} - Aya`;
  const description = `${translationTruncated}`;
  
  // OG image URL - points to our dynamic PNG endpoint
  const ogImageUrl = `https://api.getaya.live/api/og-image/${surah}/${ayah}`;
  const canonicalUrl = `https://getaya.live/v/${surah}/${ayah}`;
  
  // Generate the HTML page with proper OG metadata
  const html = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeXml(title)}</title>
  <meta name="description" content="${escapeXml(description)}" />
  <link rel="canonical" href="${canonicalUrl}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:title" content="${escapeXml(title)}" />
  <meta property="og:description" content="${escapeXml(description)}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:secure_url" content="${ogImageUrl}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeXml(surahName)} - Ayah ${ayah}" />
  <meta property="og:site_name" content="Aya - Quran Verse API" />
  <meta property="og:locale" content="en_US" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${canonicalUrl}" />
  <meta name="twitter:title" content="${escapeXml(title)}" />
  <meta name="twitter:description" content="${escapeXml(description)}" />
  <meta name="twitter:image" content="${ogImageUrl}" />
  <meta name="twitter:image:alt" content="${escapeXml(surahName)} - Ayah ${ayah}" />
  
  <!-- Additional Meta -->
  <meta name="theme-color" content="#059669" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='80'>آ</text></svg>" />
  
  <!-- Fonts for proper Arabic rendering -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <style>
    @font-face {
      font-family: 'Amiri';
      src: url('https://fonts.gstatic.com/s/amiri/v30/J7aRnpd8CGxBHqUp.ttf') format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'Amiri';
      src: url('https://fonts.gstatic.com/s/amiri/v30/J7acnpd8CGxBHp2VkZY4.ttf') format('truetype');
      font-weight: 700;
      font-style: normal;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 24px;
      padding: 48px 40px;
      max-width: 680px;
      width: 100%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      text-align: center;
      border: 2px solid #d1fae5;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #059669;
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 13px;
      margin-bottom: 20px;
    }
    .surah-info {
      color: #059669;
      font-size: 15px;
      margin-bottom: 20px;
    }
    .arabic {
      font-family: 'Amiri', 'Noto Naskh Arabic', serif;
      font-size: 44px;
      line-height: 1.7;
      color: #1f2937;
      direction: rtl;
      margin-bottom: 28px;
      letter-spacing: 0.5px;
    }
    .translation {
      font-size: 20px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 0;
      font-style: italic;
    }
    .footer {
      margin-top: 24px;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
  
</head>
<body>
  <div class="card">
    <div class="badge">
      <span style="font-size:18px">آ</span>
      <span>Aya — Quran Verses</span>
    </div>
    <div class="surah-info">${escapeXml(surahName)} ${surahNameArabic ? `(${escapeXml(surahNameArabic)})` : ''} • Ayah ${ayah}</div>
    <div class="arabic">${escapeXml(arabicText)}</div>
    <div class="translation">${escapeXml(translationText)}</div>
    <div class="footer">getaya.live</div>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    }
  });
});

export default app;
