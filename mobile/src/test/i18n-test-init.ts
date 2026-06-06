// mobile/src/test/i18n-test-init.ts
// 테스트 환경용 i18n 초기화 — @capacitor/preferences 없이 순수 i18next+React 연결.
// setup.ts 에서 import 되어 모든 테스트 전에 실행된다.
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from '../shared/i18n/locales/ko.json';
import en from '../shared/i18n/locales/en.json';
import ja from '../shared/i18n/locales/ja.json';
import zh from '../shared/i18n/locales/zh.json';

if (!i18next.isInitialized) {
  void i18next.use(initReactI18next).init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
      ja: { translation: ja },
      zh: { translation: zh },
    },
    lng: 'ko',
    fallbackLng: 'ko',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}
