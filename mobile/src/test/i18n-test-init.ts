// mobile/src/test/i18n-test-init.ts
// 테스트 환경용 i18n 초기화 — @capacitor/preferences 없이 순수 i18next+React 연결.
// setup.ts 에서 import 되어 모든 테스트 전에 실행된다.
//
// 왜 `import '../shared/i18n'` 로 프로덕션 인스턴스를 쓰지 않는가:
// index.ts 는 모듈 스코프에서 @capacitor/preferences 를 import 하는데, setup 단계는
// 각 테스트 파일의 vi.mock 보다 먼저 실행되므로 그대로 끌어오면 bootstrap.test 의 Preferences
// mock 이 깨진다. 동일 설정으로 같은 i18next 싱글턴을 직접 init 해 그 의존성을 피한다.
// (resources/옵션이 index.ts 와 일치해야 하므로 변경 시 양쪽을 함께 수정할 것.)
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
