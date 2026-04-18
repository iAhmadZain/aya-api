import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import type { AyaResponse } from '../types';

interface Props {
  verse: AyaResponse | null;
  onClose: () => void;
}

export function EmbedModal({ verse, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [style, setStyle] = useState<'minimal' | 'card' | 'full'>('card');

  if (!verse) return null;

  const embedCodes = {
    minimal: `<blockquote cite="https://getaya.live">
  <p dir="rtl" style="font-family: 'Amiri', serif; font-size: 1.5rem; line-height: 2;">${verse.text_arabic}</p>
  <p style="color: #666; margin-top: 0.5rem;">${verse.translation.text}</p>
  <footer>— ${verse.surah_transliteration} ${verse.ayah}</footer>
</blockquote>`,

    card: `<div style="background: linear-gradient(135deg, #ecfdf5, #f0fdfa); border-radius: 16px; padding: 24px; max-width: 500px; font-family: system-ui, sans-serif;">
  <p dir="rtl" style="font-family: 'Amiri', serif; font-size: 1.75rem; line-height: 2; text-align: center; color: #1f2937; margin: 0 0 16px 0;">${verse.text_arabic}</p>
  <p style="text-align: center; color: #4b5563; margin: 0 0 12px 0;">${verse.translation.text}</p>
  <p style="text-align: center; font-size: 0.875rem; color: #059669; margin: 0;">
    ${verse.surah_transliteration} ${verse.ayah} • <a href="https://getaya.live" style="color: inherit;">getaya.live</a>
  </p>
</div>`,

    full: `<iframe 
  src="https://getaya.live/embed/${verse.surah}/${verse.ayah}" 
  width="100%" 
  height="300" 
  frameborder="0" 
  style="border-radius: 16px; max-width: 500px;"
  title="${verse.surah_transliteration} ${verse.ayah}">
</iframe>`
  };

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCodes[style]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Embed This Verse</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Style Selection */}
        <div className="flex gap-2 mb-6">
          {(['minimal', 'card', 'full'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStyle(s)}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all capitalize ${
                style === s
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-emerald-300 text-gray-700 dark:text-gray-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Preview</p>
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {style === 'minimal' && (
              <blockquote>
                <p dir="rtl" className="font-arabic text-2xl leading-loose text-gray-800 dark:text-gray-100">{verse.text_arabic}</p>
                <p className="text-gray-600 dark:text-gray-300 mt-2">{verse.translation.text}</p>
                <footer className="text-sm text-gray-500 dark:text-gray-400 mt-2">— {verse.surah_transliteration} {verse.ayah}</footer>
              </blockquote>
            )}
            {style === 'card' && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl p-6">
                <p dir="rtl" className="font-arabic text-2xl leading-loose text-center text-gray-800 dark:text-gray-100">{verse.text_arabic}</p>
                <p className="text-center text-gray-600 dark:text-gray-300 mt-4">{verse.translation.text}</p>
                <p className="text-center text-sm text-emerald-600 dark:text-emerald-400 mt-3">
                  {verse.surah_transliteration} {verse.ayah} • getaya.live
                </p>
              </div>
            )}
            {style === 'full' && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <p>Interactive iframe embed</p>
                <p className="text-xs mt-1">(Opens getaya.live in a frame)</p>
              </div>
            )}
          </div>
        </div>

        {/* Code */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Embed Code</p>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono" dir="ltr">
            {embedCodes[style]}
          </pre>
        </div>

        {/* Copy Button */}
        <button
          onClick={copyEmbed}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copied ? 'Copied!' : 'Copy Embed Code'}
        </button>
      </div>
    </div>
  );
}
