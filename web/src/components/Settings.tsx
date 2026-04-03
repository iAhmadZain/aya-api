import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X } from 'lucide-react';
import { getTranslations, getScripts } from '../api';
import type { Translation, Script } from '../types';

interface Props {
  script: string;
  translation: string;
  showWords: boolean;
  onScriptChange: (script: string) => void;
  onTranslationChange: (translation: string) => void;
  onShowWordsChange: (show: boolean) => void;
}

export function Settings({
  script,
  translation,
  showWords,
  onScriptChange,
  onTranslationChange,
  onShowWordsChange,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);

  useEffect(() => {
    getTranslations().then(data => setTranslations(data.translations));
    getScripts().then(data => setScripts(data.scripts));
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg transition-all hover:scale-105"
        title="Settings"
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
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Settings</h2>
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
                  Arabic Script
                </label>
                <div className="flex gap-2">
                  {scripts.map(s => (
                    <button
                      key={s.id}
                      onClick={() => onScriptChange(s.id)}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                        script === s.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                          : 'border-gray-200 dark:border-gray-600 hover:border-emerald-300'
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
                  English Translation
                </label>
                <select
                  value={translation}
                  onChange={e => onTranslationChange(e.target.value)}
                  className="w-full p-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:border-emerald-500 outline-none"
                >
                  {translations.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Word by Word Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Word by Word</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Show individual word images</p>
                </div>
                <button
                  onClick={() => onShowWordsChange(!showWords)}
                  className={`w-14 h-7 rounded-full transition-colors ${
                    showWords ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    showWords ? 'translate-x-8' : 'translate-x-1'
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
