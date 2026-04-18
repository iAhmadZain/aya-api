import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X } from 'lucide-react';
import { getTranslations, getScripts } from '../api';
import { translations, type Language } from '../i18n';
import type { Translation, Script } from '../types';

interface Props {
  script: string;
  translation: string;
  showWords: boolean;
  onScriptChange: (script: string) => void;
  onTranslationChange: (translation: string) => void;
  onShowWordsChange: (show: boolean) => void;
  lang?: Language;
}

export function Settings({
  script,
  translation,
  showWords,
  onScriptChange,
  onTranslationChange,
  onShowWordsChange,
  lang = 'en',
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [translationsList, setTranslationsList] = useState<Translation[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const t = translations[lang];

  useEffect(() => {
    getTranslations().then(data => setTranslationsList(data.translations));
    getScripts().then(data => setScripts(data.scripts));
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 end-6 p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg transition-all hover:scale-105"
        title={t.settings}
      >
        <SettingsIcon className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t.settings}</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Script Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.arabicScript}
                </label>
                <div className="flex gap-2">
                  {scripts.map(s => (
                    <button
                      key={s.id}
                      onClick={() => onScriptChange(s.id)}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                        script === s.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                          : 'border-gray-200 dark:border-gray-600 hover:border-emerald-300 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Translation Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.translation}
                </label>
                <select
                  value={translation}
                  onChange={e => onTranslationChange(e.target.value)}
                  className="w-full p-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:border-emerald-500 outline-none"
                >
                  {translationsList.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Word by Word Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{t.wordByWord}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.wordByWordDesc}</p>
                </div>
                <button
                  onClick={() => onShowWordsChange(!showWords)}
                  className={`w-14 h-7 rounded-full transition-colors ${
                    showWords ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    showWords ? 'translate-x-8 rtl:-translate-x-1' : 'translate-x-1 rtl:translate-x-8'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
