import { useState } from 'react';

interface Props {
  surah: number;
  ayah: number;
  className?: string;
}

export function VerseImage({ surah, ayah, className = '' }: Props) {
  const [error, setError] = useState(false);
  const imageUrl = `https://api.getaya.live/api/og-image/${surah}/${ayah}`;

  if (error) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={`Verse ${surah}:${ayah}`}
      className={`max-w-full h-auto rounded-lg shadow-md ${className}`}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}
