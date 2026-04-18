import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { translations, type Language } from '../i18n';

const examples = [
  {
    titleKey: 'getRandom',
    endpoint: 'GET /api/aya/random',
    url: 'https://api.getaya.live/api/aya/random',
    response: {
      surah: 112,
      surah_name: 'الإخلاص',
      ayah: 1,
      text_arabic: 'قُلۡ هُوَ اللّٰهُ اَحَدٌ',
      translation: 'Say, "He is God the One"',
      verse_key: '112:1'
    }
  },
  {
    titleKey: 'getSpecific',
    endpoint: 'GET /api/aya/2/255',
    url: 'https://api.getaya.live/api/aya/2/255?translation=pickthall',
    response: {
      surah: 2,
      surah_name: 'البقرة',
      ayah: 255,
      text_arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
      verse_key: '2:255'
    }
  },
  {
    titleKey: 'getWords',
    endpoint: 'GET /api/aya/1/1/words',
    url: 'https://api.getaya.live/api/aya/1/1/words',
    response: {
      surah: 1,
      ayah: 1,
      images: {
        words: [
          { text: 'بِسْمِ', translation: 'In the name of' }
        ]
      }
    }
  },
  {
    titleKey: 'withParams',
    endpoint: 'GET /api/aya/random?script=indopak&translation=yusufali',
    url: 'https://api.getaya.live/api/aya/random?script=indopak&translation=yusufali',
    response: {
      script: 'indopak',
      translation: { name: 'Yusuf Ali' }
    }
  }
];

interface Props {
  lang?: Language;
}

export function APIExamples({ lang = 'en' }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const t = translations[lang];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section className="w-full max-w-4xl mx-auto mt-16 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t.apiExamples}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{t.apiExamplesDesc}</p>

        <div className="space-y-6">
          {examples.map((example, idx) => (
            <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                {t[example.titleKey as keyof typeof t]}
              </h3>
              
              {/* Endpoint */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t.endpoint}</p>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg text-sm text-gray-800 dark:text-gray-200 flex-1 font-mono overflow-x-auto" dir="ltr">
                    {example.endpoint}
                  </code>
                  <button
                    onClick={() => copyToClipboard(example.url)}
                    className="p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex-shrink-0"
                    title={t.copy}
                  >
                    {copied === example.url ? (
                      <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Response Preview */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t.response}</p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono" dir="ltr">
                  {JSON.stringify(example.response, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* Documentation Link */}
        <div className="mt-8 p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <p className="text-sm text-emerald-900 dark:text-emerald-100">
            📖{' '}
            <a
              href="https://github.com/iAhmadZain/aya-api#endpoints"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline hover:no-underline"
            >
              {t.viewDocs}
            </a>
          </p>
        </div>

        {/* cURL Example */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t.quickStart}</h3>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm font-mono" dir="ltr">
              <code>{`curl https://api.getaya.live/api/aya/random | jq

# Get specific verse
curl "https://api.getaya.live/api/aya/2/255?translation=pickthall"

# Get with word images
curl https://api.getaya.live/api/aya/1/1/words`}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
