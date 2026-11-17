import { describe, it, expect, afterAll } from 'vitest';
import i18n from '../../i18n/config';

afterAll(async () => {
  await i18n.changeLanguage('ja');
});

describe('html lang の同期（#132）', () => {
  it.each(['ja', 'en', 'ko', 'zh-TW', 'zh-CN', 'id', 'fr', 'de'])(
    '言語を %s に切り替えると <html lang> も %s になる',
    async (lng) => {
      await i18n.changeLanguage(lng);
      expect(document.documentElement.lang).toBe(lng);
    }
  );
});
