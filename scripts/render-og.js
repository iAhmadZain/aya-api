#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const fallbackData = require('../src/fallback-data.json');

const surah = parseInt(process.argv[2] || '1', 10);
const ayah = parseInt(process.argv[3] || '1', 10);
const out = process.argv[4] || '/tmp/aya-og.png';

const chapters = fallbackData.chapters || {};
const verses = fallbackData.verses || [];
const verse = verses.find(v => v.s === surah && v.v === ayah);
const chapter = chapters[String(surah)] || {};

const arabicText = verse?.a || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
const translationText = verse?.e || 'In the name of Allah, the Entirely Merciful, the Especially Merciful.';
const surahName = chapter.transliteration || `Surah ${surah}`;

const truncate = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;
const ar = truncate(arabicText, 140);
const en = truncate(translationText, 190);

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ecfdf5"/>
      <stop offset="100%" stop-color="#d1fae5"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="20" flood-color="#065f46" flood-opacity="0.12"/>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="48" y="48" width="1104" height="534" rx="28" fill="#ffffff" filter="url(#shadow)"/>

  <rect x="84" y="84" width="64" height="64" rx="16" fill="#059669"/>
  <text x="116" y="127" text-anchor="middle" font-size="34" font-weight="700" fill="#ffffff" font-family="Arial, sans-serif">آ</text>
  <text x="168" y="114" font-size="28" font-weight="700" fill="#111827" font-family="Arial, sans-serif">Aya</text>
  <text x="168" y="138" font-size="15" fill="#6b7280" font-family="Arial, sans-serif">Quran Verse API</text>

  <text x="600" y="190" text-anchor="middle" font-size="22" font-weight="600" fill="#059669" font-family="Arial, sans-serif">${surahName} • Ayah ${ayah}</text>

  <foreignObject x="110" y="220" width="980" height="150">
    <div xmlns="http://www.w3.org/1999/xhtml" style="height:150px; display:flex; align-items:center; justify-content:center; text-align:center; direction:rtl; color:#111827; font-size:48px; line-height:1.6; font-family:'Noto Naskh Arabic','Amiri','Geeza Pro','Times New Roman',serif;">${ar.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
  </foreignObject>

  <foreignObject x="130" y="390" width="940" height="105">
    <div xmlns="http://www.w3.org/1999/xhtml" style="height:105px; display:flex; align-items:center; justify-content:center; text-align:center; color:#4b5563; font-size:25px; line-height:1.5; font-family:Arial,sans-serif;">${en.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
  </foreignObject>

  <text x="600" y="545" text-anchor="middle" font-size="18" fill="#9ca3af" font-family="Arial, sans-serif">getaya.live</text>
</svg>`;

sharp(Buffer.from(svg))
  .png({ quality: 100, compressionLevel: 9 })
  .toFile(out)
  .then(() => console.log(out))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
