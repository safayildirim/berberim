import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources, type AppLanguage } from './resources';

const LANGUAGE_KEY = 'berberim-tenant-language';

const detector = {
  type: 'languageDetector' as const,
  async: true,
  init: () => undefined,
  detect: async (callback: (lng: string) => void) => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (stored === 'en' || stored === 'tr') {
        callback(stored);
        return;
      }

      const locale = getLocales()[0]?.languageCode;
      callback(locale === 'tr' ? 'tr' : 'en');
    } catch (error) {
      console.error('Language detection error:', error);
      callback('tr');
    }
  },
  cacheUserLanguage: async (lng: string) => {
    try {
      if (lng === 'en' || lng === 'tr') {
        await AsyncStorage.setItem(LANGUAGE_KEY, lng);
      }
    } catch (error) {
      console.error('Language caching error:', error);
    }
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(detector)
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v4',
      fallbackLng: 'tr',
      resources,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
}

export async function setAppLanguage(language: AppLanguage) {
  await i18n.changeLanguage(language);
}

export function getCurrentLanguage(): AppLanguage {
  return i18n.language === 'tr' ? 'tr' : 'en';
}

export default i18n;
