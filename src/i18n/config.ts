import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ja from './locales/ja.json';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import ko from './locales/ko.json';
import id from './locales/id.json';
import fr from './locales/fr.json';
import de from './locales/de.json';

export const defaultNS = 'translation';
export const resources = {
  ja: {
    translation: ja,
  },
  en: {
    translation: en,
  },
  ko: {
    translation: ko,
  },
  'zh-TW': {
    translation: zhTW,
  },
  'zh-CN': {
    translation: zhCN,
  },
  id: {
    translation: id,
  },
  fr: {
    translation: fr,
  },
  de: {
    translation: de,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    fallbackLng: 'ja',
    supportedLngs: ['ja', 'en', 'ko', 'zh-TW', 'zh-CN', 'id', 'fr', 'de'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['navigator'],
      caches: [],
    },
  });

export default i18n;
