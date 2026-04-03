# Aya API 📖

Random Quran Verse Service - اية من القرآن الكريم

A simple, fast API that returns random Quran verses with Arabic text, multiple translations, word-by-word breakdown, and image URLs.

## Live Demo

🌐 **Website:** https://aya-ejf.pages.dev  
🔌 **API:** https://aya-api.iahmadzain.workers.dev

## Features

- ✅ Multiple Arabic scripts (Uthmani, IndoPak)
- ✅ 7 English translations
- ✅ Word-by-word breakdown with images
- ✅ Page & Juz information
- ✅ SVG page images + PNG word images
- ✅ Automatic fallback to local data

## Quick Start

```bash
# Get a random verse
curl https://aya-api.iahmadzain.workers.dev/api/aya/random

# Get specific verse with translation
curl "https://aya-api.iahmadzain.workers.dev/api/aya/2/255?translation=haleem"

# Get verse with word-by-word images
curl https://aya-api.iahmadzain.workers.dev/api/aya/1/1/words
```

## Endpoints

### Random Verse
```
GET /api/aya/random
GET /api/aya/random?script=indopak&translation=pickthall
```

### Specific Verse
```
GET /api/aya/:surah/:ayah
GET /api/aya/2/255                              # Ayatul Kursi
GET /api/aya/112/1?script=indopak&translation=haleem
```

### Verse with Word-by-Word Images
```
GET /api/aya/:surah/:ayah/words
```

Returns each word with:
- Arabic text
- Image URL (PNG from qurancdn)
- Translation
- Transliteration

### Verse Images Only
```
GET /api/aya/:surah/:ayah/image
```

Returns:
- Full page SVG URL
- Word-by-word PNG URLs

### Full Surah
```
GET /api/surah/:id
GET /api/surah/1?translation=yusufali
```

### List Available Options
```
GET /api/translations    # List all translations
GET /api/scripts         # List all scripts
GET /api/info           # API statistics
```

## Query Parameters

| Parameter | Options | Default |
|-----------|---------|---------|
| `script` | `uthmani`, `indopak` | `uthmani` |
| `translation` | `sahih`, `pickthall`, `yusufali`, `haleem`, `hilali`, `usmani`, `clearquran` | `sahih` |

## Response Examples

### Basic Verse
```json
{
  "surah": 112,
  "surah_name": "الإخلاص",
  "surah_name_en": "The Sincerity",
  "surah_transliteration": "Al-Ikhlas",
  "ayah": 1,
  "text_arabic": "قُلۡ هُوَ اللّٰهُ اَحَدٌ",
  "script": "indopak",
  "translation": {
    "id": "haleem",
    "name": "M.A.S. Abdel Haleem",
    "text": "Say, 'He is God the One,"
  },
  "verse_key": "112:1",
  "page": 604,
  "juz": 30,
  "source": "api"
}
```

### With Words
```json
{
  "surah": 1,
  "ayah": 1,
  "text_arabic": "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
  "images": {
    "page_svg": "https://www.mp3quran.net/api/quran_pages_svg/001.svg",
    "words": [
      {
        "position": 1,
        "text": "بِسْمِ",
        "image_url": "https://static.qurancdn.com/images/w/rq-color/1/2/1.png",
        "translation": "In (the) name",
        "transliteration": "bis'mi"
      }
    ]
  }
}
```

### Image URLs Only
```json
{
  "surah": 2,
  "ayah": 255,
  "verse_key": "2:255",
  "page": 42,
  "images": {
    "page_svg": "https://www.mp3quran.net/api/quran_pages_svg/042.svg",
    "words": [
      {
        "position": 1,
        "text": "ٱللَّهُ",
        "image_url": "https://static.qurancdn.com/images/w/rq-color/42/8/1.png"
      }
    ]
  }
}
```

## Image Sources

| Type | Source | Format |
|------|--------|--------|
| Page Images | mp3quran.net | SVG (604 pages) |
| Word Images | static.qurancdn.com | PNG (colored) |

## Self-Hosting

### Cloudflare Workers

```bash
git clone https://github.com/iAhmadZain/aya-api.git
cd aya-api
npm install
npm run deploy
```

### Local Development

```bash
npm run dev
# API available at http://localhost:8787
```

## Web App

The website (`/web`) is built with:
- React + TypeScript
- Vite
- Tailwind CSS 4
- Deployed to Cloudflare Pages

```bash
cd web
npm install
npm run dev      # Development
npm run build    # Production build
```

## Data Sources

- **Primary API:** [quran.com](https://quran.com) / [qurancdn.com](https://qurancdn.com)
- **Fallback Data:** [risan/quran-json](https://github.com/risan/quran-json)
- **Page Images:** [mp3quran.net](https://www.mp3quran.net)
- **Word Images:** [QUL by Tarteel](https://qul.tarteel.ai)

## Use Cases

- 🌐 Embed random verses on websites
- 📱 Mobile app daily verse feature
- 🤖 Telegram/Discord bots
- 📧 Newsletter daily inspiration
- 🎨 Digital signage / displays
- 📚 Quran study applications

## License

MIT

Data: Creative Commons (CC-BY-SA-4.0)

---

Made with ☕ by [Ahmad Zain](https://iahmadzain.me)

بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
