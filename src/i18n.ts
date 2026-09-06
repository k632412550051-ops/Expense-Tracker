import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { LanguageCode } from './types';

import viTranslation from './locales/vi.json';
import enTranslation from './locales/en.json';
import jaTranslation from './locales/ja.json';
import koTranslation from './locales/ko.json';
import zhTranslation from './locales/zh.json';

export const LANGUAGE_STORAGE_KEY = 'expense_tracker_language';

/**
 * Detect the optimal language based on browser preference and supported languages
 */
export function detectBrowserLanguage(): LanguageCode {
  // Check stored preference first
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null;
    if (saved && ['vi', 'en', 'ja', 'ko', 'zh'].includes(saved)) {
      return saved;
    }
  } catch (e) {
    console.warn('Could not read saved language', e);
  }

  // Detect from browser
  const browserLangs = typeof navigator !== 'undefined' 
    ? (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''])
    : [];

  for (const lang of browserLangs) {
    const lower = lang.toLowerCase();
    if (lower.startsWith('vi')) return 'vi';
    if (lower.startsWith('en')) return 'en';
    if (lower.startsWith('ja')) return 'ja';
    if (lower.startsWith('ko')) return 'ko';
    if (lower.startsWith('zh')) return 'zh';
  }

  // Default priority fallback is Vietnamese
  return 'vi';
}

const resources = {
  vi: { translation: viTranslation },
  en: { translation: enTranslation },
  ja: { translation: jaTranslation },
  ko: { translation: koTranslation },
  zh: { translation: zhTranslation },
};

const initialLanguage = detectBrowserLanguage();

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'vi',
    supportedLngs: ['vi', 'en', 'ja', 'ko', 'zh'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

/**
 * Changes language and stores preference in localStorage
 */
export async function changeAppLanguage(lang: LanguageCode): Promise<void> {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (e) {
    console.warn('Failed to save language to localStorage', e);
  }
  await i18n.changeLanguage(lang);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
}

export default i18n;
