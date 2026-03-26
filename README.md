# Aya API 📖

Random Quran Verse Service - اية من القرآن الكريم

A simple, fast API that returns random Quran verses (ayaat) with Arabic text and English translation.

## Live API

```
https://aya-api.iahmadzain.workers.dev
```

## Endpoints

### Get Random Ayah
```bash
GET /api/aya/random
```

**Response:**
```json
{
  "surah": 56,
  "surah_name": "الواقعة",
  "surah_name_en": "The Inevitable",
  "surah_transliteration": "Al-Waqi'ah",
  "ayah": 7,
  "text_arabic": "وَكُنتُمْ أَزْوَٰجًا ثَلَـٰثَةً",
  "text_english": "And you become [of] three kinds",
  "verse_key": "56:7",
  "source": "api"
}
```

### Get Specific Ayah
```bash
GET /api/aya/:surah/:ayah
```

Example: `/api/aya/2/255` returns Ayatul Kursi

### Get Full Surah
```bash
GET /api/surah/:id
```

Example: `/api/surah/1` returns Al-Fatihah with all verses

### API Info
```bash
GET /api/info
```

Returns stats about the API (total verses, surahs, etc.)

## Architecture

**Primary:** quran.com API (for Arabic text)  
**Fallback:** Bundled JSON data (6236 verses, ~1.7MB)

If the quran.com API fails, the service automatically falls back to local data. The `source` field in the response indicates which source was used.

## Self-Hosting

### Cloudflare Workers

```bash
# Clone
git clone https://github.com/iAhmadZain/aya-api.git
cd aya-api

# Install
npm install

# Deploy
npm run deploy
```

### Environment

No API keys required! The service bundles all Quran data locally.

## Data Sources

- **Arabic Text:** [quran.com](https://quran.com) / [risan/quran-json](https://github.com/risan/quran-json)
- **English Translation:** Sahih International
- **Chapter Names:** Arabic + English transliteration

## Use Cases

- 🌐 Embed random verses on websites
- 📱 Mobile app daily verse feature
- 🤖 Telegram/Discord bots
- 📧 Newsletter daily inspiration
- 🎨 Digital signage / displays

## License

MIT

Data: Creative Commons (CC-BY-SA-4.0) - [risan/quran-json](https://github.com/risan/quran-json)

---

Made with ☕ by [Ahmad Zain](https://iahmadzain.me)

بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
