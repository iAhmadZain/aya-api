import { useState } from 'react';
import { Copy, Check, Share2, BookOpen } from 'lucide-react';
import type { AyaResponse } from '../types';

interface Props {
  verse: AyaResponse;
  showWords?: boolean;
  onWordClick?: (word: { text: string; translation?: string; transliteration?: string }) => void;
}

export function VerseCard({ verse, showWords = false, onWordClick }: Props) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    const text = `${verse.text_arabic}\n\n${verse.translation.text}\n\n— ${verse.surah_transliteration} ${verse.ayah}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${verse.surah_transliteration} ${verse.ayah}`,
        text: `${verse.text_arabic}\n\n${verse.translation.text}`,
        url: window.location.href,
      });
    }
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
              {verse.surah_transliteration} • Ayah {verse.ayah}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {verse.surah_name_en} • Page {verse.page} • Juz {verse.juz}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Copy"
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
            title="Share"
          >
            <Share2 className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Arabic Text */}
      {showWords && verse.images?.words ? (
        <div className="flex flex-wrap justify-center gap-4 mb-8" dir="rtl">
          {verse.images.words
            .filter(w => !w.text.match(/^[٠-٩]+$/)) // Filter out verse numbers
            .map((word) => (
              <button
                key={word.position}
                onClick={() => onWordClick?.(word)}
                className="word-item group flex flex-col items-center p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer"
              >
                <img
                  src={word.image_url}
                  alt={word.text}
                  className="h-16 w-auto mb-2"
                  loading="lazy"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {word.translation}
                </span>
              </button>
            ))}
        </div>
      ) : (
        <p className="arabic-text text-4xl md:text-5xl text-center text-gray-800 dark:text-gray-100 mb-8 leading-relaxed">
          {verse.text_arabic}
        </p>
      )}

      {/* Translation */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
        <p className="text-lg text-gray-600 dark:text-gray-300 text-center leading-relaxed">
          {verse.translation.text}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
          Translation: {verse.translation.name}
        </p>
      </div>
    </div>
  );
}
