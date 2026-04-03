export interface Word {
  position: number;
  text: string;
  image_url: string;
  translation?: string;
  transliteration?: string;
}

export interface AyaResponse {
  surah: number;
  surah_name: string;
  surah_name_en: string;
  surah_transliteration: string;
  ayah: number;
  text_arabic: string;
  script: string;
  translation: {
    id: string;
    name: string;
    text: string;
  };
  verse_key: string;
  page?: number;
  juz?: number;
  images?: {
    page_svg: string;
    words: Word[];
  };
  source: 'api' | 'fallback';
}

export interface Translation {
  id: string;
  name: string;
  resource_id: number;
}

export interface Script {
  id: string;
  name: string;
  description: string;
}
