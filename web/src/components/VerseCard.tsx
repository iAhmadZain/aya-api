import { useState } from 'react';
import { Copy, Check, Share2, BookOpen, Code, Download } from 'lucide-react';
import { translations, type Language } from '../i18n';
import type { AyaResponse } from '../types';

interface Props {
  verse: AyaResponse;
  showWords?: boolean;
  onWordClick?: (word: { text: string; image_url?: string; translation?: string; transliteration?: string }) => void;
  onEmbedClick?: () => void;
  lang?: Language;
}

export function VerseCard({ verse, showWords = false, onWordClick, onEmbedClick, lang = 'en' }: Props) {
  const [copied, setCopied] = useState(false);
  const t = translations[lang];

  const copyToClipboard = async () => {
    const text = `${verse.text_arabic}\n\n${verse.translation.text}\n\n— ${verse.surah_transliteration} ${verse.ayah}\n\nhttps://getaya.live`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    const shareUrl = `https://getaya.live/v/${verse.surah}/${verse.ayah}`;
    const shareText = `${verse.text_arabic}\n\n${verse.translation.text}\n\n— ${verse.surah_transliteration} ${verse.ayah}`;

    if (navigator.share) {
      await navigator.share({
        title: `${verse.surah_name} - ${verse.surah_transliteration} ${verse.ayah}`,
        text: shareText,
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    }
  };

  const downloadPng = async () => {
    const imageUrl = `https://api.getaya.live/api/og-image/${verse.surah}/${verse.ayah}`;
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `aya-${verse.surah}-${verse.ayah}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-3xl w-full animate-fade-in">
      {/* Surah Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {lang === 'ar' ? verse.surah_name : verse.surah_transliteration} • {t.ayah} {verse.ayah}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {lang === 'ar' ? verse.surah_transliteration : verse.surah_name_en} • {t.page} {verse.page} • {t.juz} {verse.juz}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={copyToClipboard}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={t.copy}
          >
            {copied ? (
              <Check className="w-5 h-5 text-emerald-500" />
            ) : (
              <Copy className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <button
            onClick={share}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={t.share}
          >
            <Share2 className="w-5 h-5 text-gray-400" />
          </button>
          <button
            onClick={downloadPng}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={t.download}
          >
            <Download className="w-5 h-5 text-gray-400" />
          </button>
          <button
            onClick={onEmbedClick}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Embed"
          >
            <Code className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Arabic Text */}
      {showWords && verse.images?.words ? (
        <>
          {/* Page SVG Image */}
          {verse.page && (
            <div className="mb-6 flex justify-center">
              <img
                src={`https://www.mp3quran.net/api/quran_pages_svg/${verse.page}.svg`}
                alt={`Page ${verse.page}`}
                className="max-w-full h-auto max-h-96 rounded-lg shadow-md bg-white"
                loading="lazy"
              />
            </div>
          )}
          {/* Word List */}
          <div className="flex flex-wrap justify-center gap-4 mb-8" dir="rtl">
            {verse.images.words
              .filter(w => !w.text.match(/^[٠-٩]+$/))
              .map((word) => (
                <button
                  key={word.position}
                  onClick={() => onWordClick?.(word)}
                  className="word-item group flex flex-col items-center p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer transition-colors"
                >
                  <span className="arabic-text text-2xl text-gray-800 dark:text-gray-100">
                    {word.text}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity text-center">
                    {word.translation}
                  </span>
                </button>
              ))}
          </div>
        </>
      ) : (
        <p className="arabic-text text-4xl md:text-5xl text-center text-gray-800 dark:text-gray-100 mb-8 leading-relaxed" dir="rtl">
          {verse.text_arabic}
        </p>
      )}

      {/* Translation */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
        <p className="text-lg text-gray-600 dark:text-gray-300 text-center leading-relaxed">
          {verse.translation.text}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
          {t.translation}: {verse.translation.name}
        </p>
      </div>
    </div>
  );
}
