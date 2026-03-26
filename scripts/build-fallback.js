#!/usr/bin/env node
/**
 * Build a compact fallback dataset combining Arabic text, English translation, and chapter info
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..');

// Load source files
const arabic = JSON.parse(fs.readFileSync(path.join(dataDir, 'quran-full.json'), 'utf8'));
const english = JSON.parse(fs.readFileSync(path.join(dataDir, 'en-translation.json'), 'utf8'));
const chapters = JSON.parse(fs.readFileSync(path.join(dataDir, 'chapters.json'), 'utf8'));

// Build chapter lookup
const chapterInfo = {};
chapters.forEach(ch => {
  chapterInfo[ch.id] = {
    name: ch.name,
    transliteration: ch.transliteration,
    translation: ch.translation,
    total_verses: ch.total_verses
  };
});

// Build flat array of all verses
const verses = [];

for (const surahNum of Object.keys(arabic)) {
  const surah = parseInt(surahNum);
  const arabicVerses = arabic[surahNum];
  const englishVerses = english[surahNum];
  
  arabicVerses.forEach((verse, idx) => {
    verses.push({
      s: surah,                              // surah number
      v: verse.verse,                        // verse number
      a: verse.text,                         // arabic text
      e: englishVerses[idx]?.text || ''      // english translation
    });
  });
}

// Build output
const output = {
  chapters: chapterInfo,
  verses: verses,
  total: verses.length
};

// Write compact JSON
fs.writeFileSync(
  path.join(dataDir, 'src', 'fallback-data.json'),
  JSON.stringify(output)
);

console.log(`✅ Built fallback data: ${verses.length} verses from ${Object.keys(chapterInfo).length} surahs`);
console.log(`   Size: ${(JSON.stringify(output).length / 1024 / 1024).toFixed(2)} MB`);
