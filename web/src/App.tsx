import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Moon, Sun, Code2, ExternalLink } from 'lucide-react';
import { getRandomAya, getAyaWithWords } from './api';
import { VerseCard } from './components/VerseCard';
import { WordModal } from './components/WordModal';
import { Settings } from './components/Settings';
import type { AyaResponse } from './types';

function App() {
  const [verse, setVerse] = useState<AyaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [script, setScript] = useState('uthmani');
  const [translation, setTranslation] = useState('sahih');
  const [showWords, setShowWords] = useState(false);
  const [selectedWord, setSelectedWord] = useState<{
    text: string;
    image_url?: string;
    translation?: string;
    transliteration?: string;
  } | null>(null);

  const fetchVerse = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRandomAya(script, translation);
      
      // If showWords is enabled, fetch word data
      if (showWords) {
        const wordsData = await getAyaWithWords(data.surah, data.ayah, script, translation);
        setVerse(wordsData);
      } else {
        setVerse(data);
      }
    } catch (err) {
      setError('Failed to fetch verse. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [script, translation, showWords]);

  useEffect(() => {
    fetchVerse();
  }, [fetchVerse]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Refetch with words when showWords changes
  useEffect(() => {
    if (verse && showWords && !verse.images?.words) {
      getAyaWithWords(verse.surah, verse.ayah, script, translation)
        .then(setVerse)
        .catch(console.error);
    }
  }, [showWords, verse, script, translation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">آ</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">Aya</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Quran Verse API</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <a
              href="https://aya-api.iahmadzain.workers.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="API Documentation"
            >
              <Code2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </a>
            <a
              href="https://github.com/iAhmadZain/aya-api"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="GitHub"
            >
              <ExternalLink className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </a>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-32">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-gray-500 dark:text-gray-400">Loading verse...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchVerse}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : verse ? (
          <>
            <VerseCard 
              verse={verse} 
              showWords={showWords}
              onWordClick={setSelectedWord}
            />
            
            {/* New Verse Button */}
            <button
              onClick={fetchVerse}
              disabled={loading}
              className="mt-8 flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl shadow-lg transition-all hover:scale-105 disabled:scale-100"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              New Verse
            </button>
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center text-sm text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <p>
          Powered by{' '}
          <a 
            href="https://quran.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Quran.com
          </a>
          {' '}•{' '}
          <a 
            href="https://qul.tarteel.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            QUL by Tarteel
          </a>
        </p>
      </footer>

      {/* Settings Panel */}
      <Settings
        script={script}
        translation={translation}
        showWords={showWords}
        onScriptChange={setScript}
        onTranslationChange={setTranslation}
        onShowWordsChange={setShowWords}
      />

      {/* Word Modal */}
      <WordModal 
        word={selectedWord} 
        onClose={() => setSelectedWord(null)} 
      />
    </div>
  );
}

export default App;
