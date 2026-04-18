# AGENTS.md - Aya API

## Project Overview

Cloudflare Workers API serving random Quran verses with multiple Arabic scripts, English translations, and word-by-word images.

**Live:** https://api.getaya.live | https://getaya.live (web app)

## Commands

```bash
npm run dev           # Start local dev server (localhost:8787)
npm run build:data    # Generate src/fallback-data.json from source JSON files
npm run deploy        # Build data + deploy to staging
npm run deploy:prod   # Build data + deploy to production
```

**Order matters:** `build:data` runs before deploy. Data build is NOT automatic in Wrangler (disabled in wrangler.toml).

## Architecture

- **Runtime:** Cloudflare Workers (Hono framework)
- **Entry:** `src/index.ts`
- **Data sources:**
  - Primary: quran.com / qurancdn.com APIs
  - Fallback: bundled `src/fallback-data.json` (6,236 verses)
- **Images:** mp3quran.net (page SVGs), static.qurancdn.com (word PNGs)

## Key Directories

- `src/` - Worker code, fallback data
- `web/` - React/Vite web app (separate deploy to Cloudflare Pages)
- `scripts/` - build-fallback.js (data preprocessing)
- `*.json` - Source data files (quran-full.json, en-translation.json, chapters.json)

## Gotchas

1. **Data build is manual** - Wrangler build command is commented out. Always run `npm run build:data` before deploy if source JSON files change.

2. **Two deployment targets** - `wrangler.toml` has `[env.production]` with route `aya.iahmadzain.me/*`. Current live surface is `getaya.live` - verify routing before production changes.

3. **No tests** - This repo has no test suite. Verify changes manually via curl against local dev server.

4. **TypeScript config** - Uses `@cloudflare/workers-types`, ESNext modules, bundler resolution. Don't change module settings without checking Workers compatibility.

5. **Web app is separate** - `/web` has its own package.json, deps, and deploy flow (Cloudflare Pages). API and web deploy independently.

## Response Contracts

All endpoints return JSON. Key fields:
- `source`: `"api"` or `"fallback"` (indicates data origin)
- `verse_key`: `"surah:ayah"` format (e.g., `"112:1"`)
- `script`: `"uthmani"` or `"indopak"`
- `translation.id`: one of `sahih`, `pickthall`, `yusufali`, `haleem`, `hilali`, `usmani`, `clearquran`

## Verification

```bash
# Test local dev
curl http://localhost:8787/api/aya/random
curl http://localhost:8787/api/aya/2/255?translation=haleem
curl http://localhost:8787/api/aya/1/1/words
```
