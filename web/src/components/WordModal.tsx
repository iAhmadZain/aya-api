import { X } from 'lucide-react';

interface Props {
  word: {
    text: string;
    image_url?: string;
    translation?: string;
    transliteration?: string;
  } | null;
  onClose: () => void;
}

export function WordModal({ word, onClose }: Props) {
  if (!word) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Word Details</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="text-center">
          {word.image_url && (
            <img
              src={word.image_url}
              alt={word.text}
              className="h-24 w-auto mx-auto mb-4"
            />
          )}
          
          <p className="arabic-text text-4xl text-gray-800 dark:text-gray-100 mb-4">
            {word.text}
          </p>

          {word.transliteration && (
            <p className="text-lg text-emerald-600 dark:text-emerald-400 mb-2 italic">
              {word.transliteration}
            </p>
          )}

          {word.translation && (
            <p className="text-gray-600 dark:text-gray-300">
              {word.translation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
