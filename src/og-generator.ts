/**
 * OG Image Generator for Aya API
 * Generates 1200x630 PNG images for any Quran verse
 * Uses workers-og for Cloudflare Workers
 * 
 * Note: workers-og (satori) has limitations with Arabic text RTL rendering
 * but provides good basic functionality for OG images in Workers environment
 */

import { ImageResponse } from 'workers-og';

// Color palette
const COLORS = {
  background: '#ecfdf5',
  backgroundEnd: '#f0fdfa',
  cardBg: '#ffffff',
  border: '#d1fae5',
  primary: '#059669',
  textPrimary: '#1f2937',
  textSecondary: '#4b5563',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
};

// Cache for fonts
let latinFontData: ArrayBuffer | null = null;

interface OGImageInput {
  surah: number;
  ayah: number;
  surahName: string;
  surahNameArabic: string;
  arabicText: string;
  translation: string;
}

/**
 * Load fonts (cached after first load)
 */
async function loadFonts(): Promise<ArrayBuffer> {
  if (!latinFontData) {
    // Load Inter for Latin text
    const latinResponse = await fetch(
      'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf'
    );
    latinFontData = await latinResponse.arrayBuffer();
  }
  
  return latinFontData;
}

/**
 * Truncate text to fit within visual constraints
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate an OG image for a specific verse
 * Uses simple, workers-og-compatible HTML structure
 * 
 * Note on Arabic text: Due to satori limitations, Arabic text will not render
 * with proper RTL shaping. For production, consider:
 * - Pre-rendering static OG images for popular verses
 * - Using Cloudflare Image Resizing with pre-rendered templates
 * - Using an external OG image generation service
 */
export async function generateOGImage(input: OGImageInput): Promise<Response> {
  const { surah, ayah, surahName, surahNameArabic, arabicText, translation } = input;

  // Load fonts
  const latinFont = await loadFonts();

  // Truncate and escape texts
  const truncatedArabic = escapeHtml(truncateText(arabicText, 80));
  const truncatedTranslation = escapeHtml(truncateText(translation, 140));
  const safeSurahName = escapeHtml(surahName);
  const safeSurahNameAr = escapeHtml(surahNameArabic);

  // Build HTML template - keep structure simple to avoid satori validation issues
  const html = `
    <div style="display: flex; flex-direction: column; width: 100%; height: 100%; background: linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.backgroundEnd} 100%); padding: 50px;">
      <div style="display: flex; flex-direction: column; background: ${COLORS.cardBg}; border-radius: 24px; padding: 40px; flex: 1; border: 2px solid ${COLORS.border};">
        
        <!-- Header -->
        <div style="display: flex; align-items: center; margin-bottom: 30px;">
          <div style="display: flex; width: 56px; height: 56px; background: ${COLORS.primary}; border-radius: 14px; align-items: center; justify-content: center; font-size: 28px; color: white;">آ</div>
          <div style="display: flex; flex-direction: column; margin-left: 16px;">
            <div style="display: flex; font-size: 26px; font-weight: bold; color: ${COLORS.textPrimary};">Aya</div>
            <div style="display: flex; font-size: 13px; color: ${COLORS.textMuted};">Quran Verse API</div>
          </div>
        </div>

        <!-- Verse Reference -->
        <div style="display: flex; justify-content: center; margin-bottom: 30px;">
          <div style="display: flex; align-items: center; justify-content: center; background: rgba(5, 150, 105, 0.1); padding: 12px 28px; border-radius: 24px; color: ${COLORS.primary}; font-size: 18px; font-weight: 600;">
            ${safeSurahName} ${surah}:${ayah}
          </div>
        </div>

        <!-- Arabic Text -->
        <div style="display: flex; justify-content: center; font-size: 28px; color: ${COLORS.textPrimary}; text-align: center; margin-bottom: 20px; line-height: 1.6; height: 80px; align-items: center;">
          ${truncatedArabic}
        </div>

        <!-- Divider -->
        <div style="display: flex; width: 300px; height: 2px; background: ${COLORS.border}; margin: 0 auto 20px auto;"></div>

        <!-- Translation -->
        <div style="display: flex; justify-content: center; font-size: 17px; color: ${COLORS.textSecondary}; text-align: center; line-height: 1.5; flex: 1; align-items: center;">
          ${truncatedTranslation}
        </div>

        <!-- Footer -->
        <div style="display: flex; justify-content: center; font-size: 14px; color: ${COLORS.textLight};">
          getaya.live
        </div>
      </div>
    </div>
  `;

  return new ImageResponse(html, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Inter',
        data: latinFont,
        weight: 400,
        style: 'normal',
      },
    ],
  });
}
