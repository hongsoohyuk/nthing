// mobile/src/shared/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Preferences } from '@capacitor/preferences';
import ko from './locales/ko.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';
import { DEFAULT_LANG, LANG_STORAGE_KEY, matchLang, type Lang } from './config';

void i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
    ja: { translation: ja },
    zh: { translation: zh },
  },
  lng: DEFAULT_LANG, // 항상 ko 로 시작 → 테스트/SSR 결정성. 런타임은 bootstrap 이 덮어씀.
  fallbackLng: DEFAULT_LANG,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

// 런타임 부팅: 저장된 선택값 → navigator → ko. App 부팅 게이트에서 await 한다.
export async function bootstrapI18n(): Promise<void> {
  let lang: Lang = DEFAULT_LANG;
  try {
    const { value } = await Preferences.get({ key: LANG_STORAGE_KEY });
    const saved = matchLang(value);
    if (saved) {
      lang = saved;
    } else {
      const nav = typeof navigator !== 'undefined' ? navigator.language : null;
      lang = matchLang(nav) ?? DEFAULT_LANG;
    }
  } catch {
    // Preferences 접근 실패 → 기본 ko 유지
  }
  if (i18n.language !== lang) await i18n.changeLanguage(lang);
}

// 설정 화면에서 호출: 언어 변경 + 영속화
export async function changeLanguagePersisted(lang: Lang): Promise<void> {
  await i18n.changeLanguage(lang);
  await Preferences.set({ key: LANG_STORAGE_KEY, value: lang });
}

export default i18n;
