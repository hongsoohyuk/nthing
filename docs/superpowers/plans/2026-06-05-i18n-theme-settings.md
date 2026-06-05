# i18n + 다크/라이트 테마 설정 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 하드코딩된 한글 UI 레이블을 react-i18next로 전부 다국어(ko/en/ja/zh) 처리하고, 신규 설정 화면에서 언어와 테마(라이트/다크/시스템)를 전환할 수 있게 한다.

**Architecture:** `src/shared/i18n/`에 i18next 인스턴스를 정적 번들 리소스로 초기화하고(기본 언어 `ko` → 테스트는 자동으로 한글 렌더), 런타임에서만 `bootstrapI18n()`이 navigator/Preferences로 실제 언어를 결정한다. 테마는 Zustand `themeStore`가 `documentElement.classList`의 `dark`를 토글하고 `system` 모드는 `matchMedia`를 실시간 구독한다. 앱 부팅 시 auth/theme/i18n 하이드레이션을 모두 끝낸 뒤 첫 페인트를 시작해 FOUC를 막는다.

**Tech Stack:** Vite + React 19 + TypeScript, react-i18next + i18next, Zustand, Capacitor Preferences, Tailwind(`darkMode: 'class'`), Vitest + Testing Library.

---

## 파일 구조

생성:
- `src/shared/i18n/config.ts` — 지원 언어 타입/목록, Preferences 키, navigator 감지 매핑
- `src/shared/i18n/index.ts` — i18next 인스턴스 init + `bootstrapI18n()` + `changeLanguagePersisted()`
- `src/shared/i18n/locales/ko.json` — 원본(source of truth)
- `src/shared/i18n/locales/en.json`
- `src/shared/i18n/locales/ja.json`
- `src/shared/i18n/locales/zh.json`
- `src/shared/i18n/i18n.test.ts`
- `src/shared/stores/themeStore.ts`
- `src/shared/stores/themeStore.test.ts`
- `src/routes/Settings.tsx`
- `src/routes/Settings.test.tsx`

수정:
- `package.json` — deps 추가
- `src/test/setup.ts` — i18n(ko)·matchMedia mock 로드
- `src/App.tsx` — Settings 라우트 + 부팅 게이트(theme/i18n 하이드레이션)
- `src/main.tsx` — (변경 없음, App이 부팅 담당)
- 문자열 마이그레이션: `BottomNav, Badge, AppBar, states/LoadingState, KakaoMap, SplitCard, format.ts, Login, Home, Map, Profile, CreateSplit, SplitDetail, SplitList, AuthCallback, Catalog, MainLayout, PushPrimingSheet, pushService, oauth, appleNative, imagePicker, http.ts`

---

## Task 1: 의존성 설치

**Files:**
- Modify: `mobile/package.json`

- [ ] **Step 1: 패키지 설치**

Run (cwd `mobile/`):
```bash
pnpm add i18next@^25 react-i18next@^15
```

- [ ] **Step 2: 설치 확인**

Run: `pnpm ls i18next react-i18next`
Expected: 두 패키지 버전이 출력된다(설치 성공).

- [ ] **Step 3: 커밋**

```bash
git add mobile/package.json mobile/pnpm-lock.yaml
git commit -m "chore(mobile): add i18next + react-i18next"
```

---

## Task 2: i18n 스캐폴딩 + 로케일 사전

**Files:**
- Create: `mobile/src/shared/i18n/config.ts`
- Create: `mobile/src/shared/i18n/locales/{ko,en,ja,zh}.json`
- Create: `mobile/src/shared/i18n/index.ts`
- Create: `mobile/src/shared/i18n/i18n.test.ts`

- [ ] **Step 1: config.ts 작성**

```ts
// mobile/src/shared/i18n/config.ts
export const SUPPORTED_LANGS = ['ko', 'en', 'ja', 'zh'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: Lang = 'ko';
export const LANG_STORAGE_KEY = 'nthing.lang';

export const LANG_LABEL: Record<Lang, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '简体中文',
};

// navigator.language("ko-KR", "zh-Hans-CN" 등) → 지원 Lang 또는 null
export function matchLang(raw: string | undefined | null): Lang | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.startsWith('ko')) return 'ko';
  if (lower.startsWith('ja')) return 'ja';
  if (lower.startsWith('zh')) return 'zh';
  if (lower.startsWith('en')) return 'en';
  return null;
}
```

- [ ] **Step 2: ko.json 작성 (원본, 현재 카피 그대로)**

```json
{
  "common": {
    "guest": "게스트",
    "join": "반띵할게요",
    "registerSplit": "반띵 등록하기",
    "retry": "다시 시도",
    "people": "{{count}}명",
    "qty": "{{count}}개"
  },
  "aria": {
    "back": "뒤로가기",
    "settings": "설정"
  },
  "nav": {
    "home": "홈",
    "map": "지도",
    "profile": "나"
  },
  "login": {
    "tagline": "반띵하자",
    "subtitle": "근처에서 N분의 1, 같이 사요",
    "kakao": "카카오로 시작하기",
    "naver": "네이버로 시작하기",
    "google": "Google로 시작하기",
    "apple": "Apple로 시작하기",
    "devLogin": "테스트 로그인 (개발용)",
    "appleError": "Apple 로그인에 실패했어요. 설정 > Apple 계정 로그인을 확인해 주세요"
  },
  "splits": {
    "loadError": "반띵을 불러오지 못했어요",
    "emptyTitle": "아직 반띵이 없어요",
    "emptySubtitle": "첫 반띵을 올려보세요",
    "recruitCount": "{{count}}명 모집",
    "perPersonShort": "1인당 {{price}}"
  },
  "home": {
    "title": "근처 반띵",
    "filterAll": "전체",
    "filterRecruiting": "모집중"
  },
  "map": {
    "title": "지도",
    "loadError": "지도를 불러올 수 없어요"
  },
  "profile": {
    "title": "나의 반띵",
    "mySplits": "내 나눠사기",
    "participated": "참여한 나눠사기",
    "nearbyAlerts": "근처 알림",
    "logout": "로그아웃"
  },
  "settings": {
    "title": "설정",
    "languageSection": "언어",
    "themeSection": "테마",
    "notificationsSection": "알림",
    "themeLight": "라이트",
    "themeDark": "다크",
    "themeSystem": "시스템"
  },
  "create": {
    "title": "내 반띵 올리기",
    "photoAlt": "첨부 사진",
    "uploading": "업로드 중…",
    "addPhoto": "사진 추가",
    "uploadError": "사진 업로드에 실패했어요. 다시 시도해 주세요.",
    "fieldName": "상품명",
    "fieldNamePlaceholder": "예: 두쫀쿠 4개입",
    "fieldPrice": "전체 가격",
    "fieldQty": "전체 수량",
    "fieldCount": "나눌 인원",
    "fieldCountSupport": "최소 2명",
    "fieldAddress": "주소",
    "fieldAddressPlaceholder": "만날 위치",
    "perPersonEstimate": "1인당 예상 가격"
  },
  "detail": {
    "title": "반띵 상세",
    "perPerson": "1인당",
    "totalPrice": "전체 가격",
    "totalQty": "전체 수량",
    "splitCount": "나눌 인원",
    "location": "위치",
    "closed": "마감된 반띵",
    "cancel": "취소하기"
  },
  "list": {
    "loadError": "목록을 불러오지 못했어요"
  },
  "states": {
    "loading": "불러오는 중…"
  },
  "status": {
    "waiting": "모집중",
    "matched": "매칭됨",
    "completed": "완료",
    "cancelled": "취소",
    "urgent": "마감임박"
  },
  "push": {
    "primingTitle": "근처 반띵 알림을 받을까요?",
    "primingBody": "근처에 새 반띵이 올라오거나 내 반띵에 참여가 생기면 알려드려요.",
    "primingAccept": "알림 받기",
    "primingLater": "나중에"
  },
  "auth": {
    "callbackFailed": "로그인에 실패했어요",
    "callbackLoading": "로그인 중..."
  },
  "time": {
    "justNow": "방금 전",
    "minutesAgo": "{{count}}분 전",
    "hoursAgo": "{{count}}시간 전",
    "daysAgo": "{{count}}일 전"
  },
  "error": {
    "requestFailed": "요청 실패 ({{status}})"
  }
}
```

- [ ] **Step 3: en.json 작성**

```json
{
  "common": {
    "guest": "Guest",
    "join": "Join in",
    "registerSplit": "Post a split",
    "retry": "Try again",
    "people": "{{count}} people",
    "qty": "{{count}} ea"
  },
  "aria": {
    "back": "Back",
    "settings": "Settings"
  },
  "nav": {
    "home": "Home",
    "map": "Map",
    "profile": "Me"
  },
  "login": {
    "tagline": "Let's split it",
    "subtitle": "Split it nearby, buy together",
    "kakao": "Continue with Kakao",
    "naver": "Continue with Naver",
    "google": "Continue with Google",
    "apple": "Continue with Apple",
    "devLogin": "Test login (dev)",
    "appleError": "Apple sign-in failed. Check Settings > Apple Account sign-in."
  },
  "splits": {
    "loadError": "Couldn't load splits",
    "emptyTitle": "No splits yet",
    "emptySubtitle": "Post the first split",
    "recruitCount": "{{count}} needed",
    "perPersonShort": "{{price}} each"
  },
  "home": {
    "title": "Nearby splits",
    "filterAll": "All",
    "filterRecruiting": "Open"
  },
  "map": {
    "title": "Map",
    "loadError": "Couldn't load the map"
  },
  "profile": {
    "title": "My splits",
    "mySplits": "My splits",
    "participated": "Joined splits",
    "nearbyAlerts": "Nearby alerts",
    "logout": "Log out"
  },
  "settings": {
    "title": "Settings",
    "languageSection": "Language",
    "themeSection": "Theme",
    "notificationsSection": "Notifications",
    "themeLight": "Light",
    "themeDark": "Dark",
    "themeSystem": "System"
  },
  "create": {
    "title": "Post my split",
    "photoAlt": "Attached photo",
    "uploading": "Uploading…",
    "addPhoto": "Add photo",
    "uploadError": "Photo upload failed. Please try again.",
    "fieldName": "Product name",
    "fieldNamePlaceholder": "e.g. Choco cookies, pack of 4",
    "fieldPrice": "Total price",
    "fieldQty": "Total quantity",
    "fieldCount": "People to split with",
    "fieldCountSupport": "At least 2",
    "fieldAddress": "Address",
    "fieldAddressPlaceholder": "Meeting spot",
    "perPersonEstimate": "Estimated price each"
  },
  "detail": {
    "title": "Split details",
    "perPerson": "Each",
    "totalPrice": "Total price",
    "totalQty": "Total quantity",
    "splitCount": "People to split with",
    "location": "Location",
    "closed": "Split closed",
    "cancel": "Cancel"
  },
  "list": {
    "loadError": "Couldn't load the list"
  },
  "states": {
    "loading": "Loading…"
  },
  "status": {
    "waiting": "Open",
    "matched": "Matched",
    "completed": "Done",
    "cancelled": "Cancelled",
    "urgent": "Closing soon"
  },
  "push": {
    "primingTitle": "Get nearby split alerts?",
    "primingBody": "We'll notify you when a new split appears nearby or someone joins yours.",
    "primingAccept": "Get alerts",
    "primingLater": "Later"
  },
  "auth": {
    "callbackFailed": "Sign-in failed",
    "callbackLoading": "Signing in..."
  },
  "time": {
    "justNow": "just now",
    "minutesAgo": "{{count}}m ago",
    "hoursAgo": "{{count}}h ago",
    "daysAgo": "{{count}}d ago"
  },
  "error": {
    "requestFailed": "Request failed ({{status}})"
  }
}
```

- [ ] **Step 4: ja.json 작성**

```json
{
  "common": {
    "guest": "ゲスト",
    "join": "参加します",
    "registerSplit": "シェアを登録",
    "retry": "再試行",
    "people": "{{count}}人",
    "qty": "{{count}}個"
  },
  "aria": {
    "back": "戻る",
    "settings": "設定"
  },
  "nav": {
    "home": "ホーム",
    "map": "地図",
    "profile": "マイ"
  },
  "login": {
    "tagline": "わけ買いしよう",
    "subtitle": "近くでN分の1、一緒に買おう",
    "kakao": "Kakaoで始める",
    "naver": "Naverで始める",
    "google": "Googleで始める",
    "apple": "Appleで始める",
    "devLogin": "テストログイン（開発用）",
    "appleError": "Appleログインに失敗しました。設定 > Appleアカウントのサインインをご確認ください"
  },
  "splits": {
    "loadError": "シェアを読み込めませんでした",
    "emptyTitle": "まだシェアがありません",
    "emptySubtitle": "最初のシェアを投稿しましょう",
    "recruitCount": "{{count}}人募集",
    "perPersonShort": "1人あたり{{price}}"
  },
  "home": {
    "title": "近くのシェア",
    "filterAll": "すべて",
    "filterRecruiting": "募集中"
  },
  "map": {
    "title": "地図",
    "loadError": "地図を読み込めませんでした"
  },
  "profile": {
    "title": "マイシェア",
    "mySplits": "自分のシェア",
    "participated": "参加したシェア",
    "nearbyAlerts": "近くの通知",
    "logout": "ログアウト"
  },
  "settings": {
    "title": "設定",
    "languageSection": "言語",
    "themeSection": "テーマ",
    "notificationsSection": "通知",
    "themeLight": "ライト",
    "themeDark": "ダーク",
    "themeSystem": "システム"
  },
  "create": {
    "title": "シェアを投稿",
    "photoAlt": "添付写真",
    "uploading": "アップロード中…",
    "addPhoto": "写真を追加",
    "uploadError": "写真のアップロードに失敗しました。もう一度お試しください。",
    "fieldName": "商品名",
    "fieldNamePlaceholder": "例: チョコクッキー 4個入り",
    "fieldPrice": "合計金額",
    "fieldQty": "合計数量",
    "fieldCount": "分け合う人数",
    "fieldCountSupport": "最低2人",
    "fieldAddress": "住所",
    "fieldAddressPlaceholder": "待ち合わせ場所",
    "perPersonEstimate": "1人あたりの予想金額"
  },
  "detail": {
    "title": "シェアの詳細",
    "perPerson": "1人あたり",
    "totalPrice": "合計金額",
    "totalQty": "合計数量",
    "splitCount": "分け合う人数",
    "location": "場所",
    "closed": "締め切ったシェア",
    "cancel": "キャンセル"
  },
  "list": {
    "loadError": "リストを読み込めませんでした"
  },
  "states": {
    "loading": "読み込み中…"
  },
  "status": {
    "waiting": "募集中",
    "matched": "マッチ済み",
    "completed": "完了",
    "cancelled": "キャンセル",
    "urgent": "締切間近"
  },
  "push": {
    "primingTitle": "近くのシェア通知を受け取りますか？",
    "primingBody": "近くで新しいシェアが投稿されたり、自分のシェアに参加があるとお知らせします。",
    "primingAccept": "通知を受け取る",
    "primingLater": "あとで"
  },
  "auth": {
    "callbackFailed": "ログインに失敗しました",
    "callbackLoading": "ログイン中..."
  },
  "time": {
    "justNow": "たった今",
    "minutesAgo": "{{count}}分前",
    "hoursAgo": "{{count}}時間前",
    "daysAgo": "{{count}}日前"
  },
  "error": {
    "requestFailed": "リクエスト失敗 ({{status}})"
  }
}
```

- [ ] **Step 5: zh.json 작성 (간체)**

```json
{
  "common": {
    "guest": "访客",
    "join": "我要拼",
    "registerSplit": "发布拼单",
    "retry": "重试",
    "people": "{{count}}人",
    "qty": "{{count}}个"
  },
  "aria": {
    "back": "返回",
    "settings": "设置"
  },
  "nav": {
    "home": "首页",
    "map": "地图",
    "profile": "我的"
  },
  "login": {
    "tagline": "一起拼单吧",
    "subtitle": "就近拼单，一起购买",
    "kakao": "使用 Kakao 登录",
    "naver": "使用 Naver 登录",
    "google": "使用 Google 登录",
    "apple": "使用 Apple 登录",
    "devLogin": "测试登录（开发用）",
    "appleError": "Apple 登录失败。请检查设置 > Apple 账户登录。"
  },
  "splits": {
    "loadError": "无法加载拼单",
    "emptyTitle": "还没有拼单",
    "emptySubtitle": "来发布第一个拼单吧",
    "recruitCount": "招募{{count}}人",
    "perPersonShort": "每人{{price}}"
  },
  "home": {
    "title": "附近拼单",
    "filterAll": "全部",
    "filterRecruiting": "招募中"
  },
  "map": {
    "title": "地图",
    "loadError": "无法加载地图"
  },
  "profile": {
    "title": "我的拼单",
    "mySplits": "我的拼单",
    "participated": "参与的拼单",
    "nearbyAlerts": "附近通知",
    "logout": "退出登录"
  },
  "settings": {
    "title": "设置",
    "languageSection": "语言",
    "themeSection": "主题",
    "notificationsSection": "通知",
    "themeLight": "浅色",
    "themeDark": "深色",
    "themeSystem": "跟随系统"
  },
  "create": {
    "title": "发布我的拼单",
    "photoAlt": "附加照片",
    "uploading": "上传中…",
    "addPhoto": "添加照片",
    "uploadError": "照片上传失败，请重试。",
    "fieldName": "商品名称",
    "fieldNamePlaceholder": "例：巧克力饼干 4个装",
    "fieldPrice": "总价",
    "fieldQty": "总数量",
    "fieldCount": "拼单人数",
    "fieldCountSupport": "至少2人",
    "fieldAddress": "地址",
    "fieldAddressPlaceholder": "见面地点",
    "perPersonEstimate": "每人预计价格"
  },
  "detail": {
    "title": "拼单详情",
    "perPerson": "每人",
    "totalPrice": "总价",
    "totalQty": "总数量",
    "splitCount": "拼单人数",
    "location": "位置",
    "closed": "已结束的拼单",
    "cancel": "取消"
  },
  "list": {
    "loadError": "无法加载列表"
  },
  "states": {
    "loading": "加载中…"
  },
  "status": {
    "waiting": "招募中",
    "matched": "已匹配",
    "completed": "已完成",
    "cancelled": "已取消",
    "urgent": "即将结束"
  },
  "push": {
    "primingTitle": "接收附近拼单通知？",
    "primingBody": "当附近有新拼单，或有人参与你的拼单时，我们会通知你。",
    "primingAccept": "接收通知",
    "primingLater": "稍后"
  },
  "auth": {
    "callbackFailed": "登录失败",
    "callbackLoading": "登录中..."
  },
  "time": {
    "justNow": "刚刚",
    "minutesAgo": "{{count}}分钟前",
    "hoursAgo": "{{count}}小时前",
    "daysAgo": "{{count}}天前"
  },
  "error": {
    "requestFailed": "请求失败 ({{status}})"
  }
}
```

- [ ] **Step 6: index.ts 작성 (i18next 인스턴스 + bootstrap)**

핵심 설계: 모듈 로드 시 항상 `lng: 'ko'`로 동기 초기화 → 유닛 테스트는 자동으로 한글 렌더. 실제 언어 결정은 런타임에서 `bootstrapI18n()`만 수행(테스트에선 호출 안 함).

```ts
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
```

- [ ] **Step 7: 실패하는 테스트 작성**

```ts
// mobile/src/shared/i18n/i18n.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import i18n from './index';
import { matchLang } from './config';

describe('matchLang', () => {
  it('navigator 로케일을 지원 언어로 매핑', () => {
    expect(matchLang('ko-KR')).toBe('ko');
    expect(matchLang('en-US')).toBe('en');
    expect(matchLang('ja')).toBe('ja');
    expect(matchLang('zh-Hans-CN')).toBe('zh');
    expect(matchLang('fr-FR')).toBeNull();
    expect(matchLang(null)).toBeNull();
  });
});

describe('i18n instance', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('ko');
  });

  it('기본 언어는 한국어', () => {
    expect(i18n.t('home.title')).toBe('근처 반띵');
  });

  it('언어 전환 시 번역이 바뀐다', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('home.title')).toBe('Nearby splits');
    await i18n.changeLanguage('ja');
    expect(i18n.t('home.title')).toBe('近くのシェア');
    await i18n.changeLanguage('zh');
    expect(i18n.t('home.title')).toBe('附近拼单');
  });

  it('보간(count) 적용', async () => {
    await i18n.changeLanguage('ko');
    expect(i18n.t('time.minutesAgo', { count: 30 })).toBe('30분 전');
    expect(i18n.t('common.people', { count: 2 })).toBe('2명');
  });
});
```

- [ ] **Step 8: 테스트 실행 → 실패 확인**

Run (cwd `mobile/`): `pnpm vitest run src/shared/i18n/i18n.test.ts`
Expected: 통과(이미 구현됨). 만약 import 경로/JSON resolveJsonModule 문제로 실패하면 `tsconfig`에 `"resolveJsonModule": true`가 있는지 확인. (TDD 취지상 이 태스크는 구현+테스트 동시 작성이므로 통과가 목표.)

- [ ] **Step 9: 커밋**

```bash
git add mobile/src/shared/i18n
git commit -m "feat(mobile): i18n scaffolding with ko/en/ja/zh locales"
```

---

## Task 3: themeStore

**Files:**
- Create: `mobile/src/shared/stores/themeStore.ts`
- Create: `mobile/src/shared/stores/themeStore.test.ts`

- [ ] **Step 1: themeStore.ts 작성**

```ts
// mobile/src/shared/stores/themeStore.ts
import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';

export type ThemeMode = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'nthing.theme';

function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

function applyClass(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const dark = mode === 'dark' || (mode === 'system' && prefersDark());
  document.documentElement.classList.toggle('dark', dark);
}

let mql: MediaQueryList | null = null;
let listener: ((e: MediaQueryListEvent) => void) | null = null;

// system 모드일 때만 OS 변경을 실시간 반영. 다른 모드로 바뀌면 해제.
function syncSystemListener(mode: ThemeMode): void {
  if (typeof window === 'undefined' || !window.matchMedia) return;
  if (mode === 'system') {
    if (!mql) {
      mql = window.matchMedia('(prefers-color-scheme: dark)');
      listener = () => applyClass('system');
      mql.addEventListener('change', listener);
    }
  } else if (mql && listener) {
    mql.removeEventListener('change', listener);
    mql = null;
    listener = null;
  }
}

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  hydrate: () => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  setMode: (mode) => {
    applyClass(mode);
    syncSystemListener(mode);
    set({ mode });
    void Preferences.set({ key: STORAGE_KEY, value: mode });
  },
  hydrate: async () => {
    let mode: ThemeMode = 'system';
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      if (value === 'light' || value === 'dark' || value === 'system') mode = value;
    } catch {
      // 실패 시 system 기본
    }
    applyClass(mode);
    syncSystemListener(mode);
    set({ mode });
  },
}));
```

- [ ] **Step 2: 실패하는 테스트 작성**

```ts
// mobile/src/shared/stores/themeStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useThemeStore } from './themeStore';

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn().mockResolvedValue({ value: null }),
    set: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('themeStore', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    useThemeStore.setState({ mode: 'system' });
  });

  it('dark 모드 → html.dark 추가', () => {
    useThemeStore.getState().setMode('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  it('light 모드 → html.dark 제거', () => {
    document.documentElement.classList.add('dark');
    useThemeStore.getState().setMode('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('system 모드 → matchMedia 결과를 따른다 (mock=false → 미적용)', () => {
    useThemeStore.getState().setMode('system');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('hydrate 는 저장값을 반영 (없으면 system)', async () => {
    await useThemeStore.getState().hydrate();
    expect(useThemeStore.getState().mode).toBe('system');
  });
});
```

- [ ] **Step 3: matchMedia mock 보강 — setup.ts (Task 6에서 공통화하지만 지금 필요)**

`src/test/setup.ts`에 jsdom용 matchMedia stub이 없으면 테스트가 깨진다. setup.ts를 다음으로 수정:

```ts
// mobile/src/test/setup.ts
import '@testing-library/jest-dom';
import './i18n-test-init';

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
```

그리고 `src/test/i18n-test-init.ts` 생성(i18n을 ko로 강제 로드):

```ts
// mobile/src/test/i18n-test-init.ts
import i18n from '../shared/i18n';
void i18n.changeLanguage('ko');
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `pnpm vitest run src/shared/stores/themeStore.test.ts`
Expected: 4개 테스트 PASS.

- [ ] **Step 5: 커밋**

```bash
git add mobile/src/shared/stores/themeStore.ts mobile/src/shared/stores/themeStore.test.ts mobile/src/test/setup.ts mobile/src/test/i18n-test-init.ts
git commit -m "feat(mobile): theme store (light/dark/system) with live system sync"
```

---

## Task 4: 앱 부팅 게이트 (theme + i18n 하이드레이션)

**Files:**
- Modify: `mobile/src/App.tsx`

- [ ] **Step 1: App.tsx 부팅 로직 교체**

기존 `isHydrated` 단일 게이트를 auth/theme/i18n 3종 하이드레이션을 모두 끝낸 `ready` 게이트로 교체. import 추가 + 본문 수정.

기존:
```tsx
function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void useAuthStore.getState().logout();
    });
    void hydrate();
  }, [hydrate]);

  if (!isHydrated) return null; // 토큰 복원 전 짧은 공백 (스플래시 대체)
```

교체:
```tsx
import { useEffect, useState } from 'react';
// ...기존 import 유지...
import { useThemeStore } from './shared/stores/themeStore';
import { bootstrapI18n } from './shared/i18n';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void useAuthStore.getState().logout();
    });
    void Promise.all([
      useAuthStore.getState().hydrate(),
      useThemeStore.getState().hydrate(),
      bootstrapI18n(),
    ]).then(() => setReady(true));
  }, []);

  if (!ready) return null; // auth/theme/언어 복원 전 공백 (FOUC 방지)
```

> 나머지 본문(QueryClientProvider ~ Routes)은 그대로. `import { useEffect } from 'react';`가 이미 있으면 `useState`만 추가.

- [ ] **Step 2: Settings 라우트 추가 (App.tsx Routes 내부)**

`import { Settings } from './routes/Settings';` 추가하고, `/profile` 형제로 풀스크린 라우트 추가(셸 없음, CreateSplit과 동일 위치). `<Route path="/splits/new" .../>` 위에 삽입:

```tsx
<Route
  path="/settings"
  element={
    <RequireAuth>
      <Settings />
    </RequireAuth>
  }
/>
```

> Settings 컴포넌트는 Task 5에서 생성. 이 스텝은 Task 5 직후 빌드가 통과하도록 import만 맞춘다. 순서상 Task 5를 먼저 끝낸 뒤 이 import를 추가해도 무방하다.

- [ ] **Step 3: 기존 App 테스트 영향 확인**

Run: `pnpm vitest run src/routes/MainLayout.test.tsx`
Expected: 여전히 PASS (App.tsx 변경은 부팅 게이트만, 라우팅 구조 동일).

- [ ] **Step 4: 커밋**

```bash
git add mobile/src/App.tsx
git commit -m "feat(mobile): boot gate hydrates auth/theme/i18n before first paint"
```

---

## Task 5: 설정 화면

**Files:**
- Create: `mobile/src/routes/Settings.tsx`
- Create: `mobile/src/routes/Settings.test.tsx`
- Modify: `mobile/src/routes/Profile.tsx` (톱니 → /settings, 근처 알림 토글 이전)

- [ ] **Step 1: Settings.tsx 작성**

```tsx
// mobile/src/routes/Settings.tsx
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { setNearbyAlerts } from '../features/notifications/pushService';
import { changeLanguagePersisted } from '../shared/i18n';
import { LANG_LABEL, SUPPORTED_LANGS, type Lang } from '../shared/i18n/config';
import { AppBar } from '../shared/components/AppBar';
import { Card } from '../shared/components/Card';
import { useThemeStore, type ThemeMode } from '../shared/stores/themeStore';

function Row({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-between"
    >
      <span className="text-body text-gray-900 dark:text-gray-100">{label}</span>
      {selected && <Check className="size-5 text-brand dark:text-brand-dark-adj" aria-hidden />}
    </button>
  );
}

export function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const isNative = Capacitor.isNativePlatform();
  const [nearby, setNearby] = useState(true);

  useEffect(() => {
    if (!isNative) return;
    void (async () => {
      const { value } = await Preferences.get({ key: 'nthing.push.nearby' });
      if (value !== null) setNearby(value === '1');
    })();
  }, [isNative]);

  const toggleNearby = () => {
    const next = !nearby;
    setNearby(next);
    void Preferences.set({ key: 'nthing.push.nearby', value: next ? '1' : '0' });
    void setNearbyAlerts(next);
  };

  const themes: ThemeMode[] = ['light', 'dark', 'system'];
  const themeLabel: Record<ThemeMode, string> = {
    light: t('settings.themeLight'),
    dark: t('settings.themeDark'),
    system: t('settings.themeSystem'),
  };

  return (
    <div>
      <AppBar title={t('settings.title')} onBack={() => navigate(-1)} />

      <div className="space-y-6 px-4 py-2">
        <section>
          <h2 className="mb-1 text-caption text-gray-500">{t('settings.languageSection')}</h2>
          <Card>
            {SUPPORTED_LANGS.map((lang: Lang) => (
              <Row
                key={lang}
                label={LANG_LABEL[lang]}
                selected={i18n.language === lang}
                onClick={() => void changeLanguagePersisted(lang)}
              />
            ))}
          </Card>
        </section>

        <section>
          <h2 className="mb-1 text-caption text-gray-500">{t('settings.themeSection')}</h2>
          <Card>
            {themes.map((m) => (
              <Row key={m} label={themeLabel[m]} selected={mode === m} onClick={() => setMode(m)} />
            ))}
          </Card>
        </section>

        {isNative && (
          <section>
            <h2 className="mb-1 text-caption text-gray-500">
              {t('settings.notificationsSection')}
            </h2>
            <Card>
              <div className="flex h-12 items-center justify-between">
                <span className="text-body text-gray-900 dark:text-gray-100">
                  {t('profile.nearbyAlerts')}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={nearby}
                  aria-label={t('profile.nearbyAlerts')}
                  onClick={toggleNearby}
                  className={`inline-flex h-6 w-11 items-center rounded-pill px-0.5 transition-colors ${
                    nearby ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`size-5 rounded-full bg-white shadow transition-transform ${
                      nearby ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 실패하는 테스트 작성**

```tsx
// mobile/src/routes/Settings.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../shared/i18n';
import { Settings } from './Settings';
import { useThemeStore } from '../shared/stores/themeStore';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false, getPlatform: () => 'web' },
}));
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn().mockResolvedValue({ value: null }),
    set: vi.fn().mockResolvedValue(undefined),
  },
}));

function renderSettings() {
  return render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>,
  );
}

describe('Settings', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('ko');
    document.documentElement.classList.remove('dark');
    useThemeStore.setState({ mode: 'system' });
  });

  it('언어/테마 섹션을 렌더', () => {
    renderSettings();
    expect(screen.getByText('언어')).toBeInTheDocument();
    expect(screen.getByText('테마')).toBeInTheDocument();
    expect(screen.getByText('한국어')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('English 선택 시 화면 텍스트가 영어로 바뀐다', async () => {
    renderSettings();
    await userEvent.click(screen.getByText('English'));
    expect(await screen.findByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  it('다크 선택 시 html.dark 토글', async () => {
    renderSettings();
    await userEvent.click(screen.getByText('다크'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(useThemeStore.getState().mode).toBe('dark');
  });
});
```

- [ ] **Step 3: 테스트 실행 → 통과 확인**

Run: `pnpm vitest run src/routes/Settings.test.tsx`
Expected: 3개 PASS. (테스트 종료 후 i18n이 en으로 남을 수 있으나, 각 테스트 beforeEach에서 ko로 리셋하므로 다른 파일에 영향 없음 — 단, 전역 i18n 공유 이슈 방지를 위해 이 파일 afterEach로도 ko 복원 권장은 생략 가능.)

- [ ] **Step 4: Profile.tsx 수정 — 톱니 활성화 + 근처 알림 토글 제거**

Profile에서 (a) 톱니 버튼이 `/settings`로 이동하게 하고, (b) 근처 알림 토글 블록과 관련 상태/이펙트를 제거(설정 화면으로 이전됨), (c) 남은 한글은 Task 7에서 i18n 처리하지만 여기서는 톱니/토글만 손댄다.

톱니 버튼 수정(`actions` 내부):
```tsx
<button
  type="button"
  aria-label="설정"
  onClick={() => navigate('/settings')}
  className="inline-flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
>
  <Settings className="size-5 text-gray-700 dark:text-gray-200" />
</button>
```

근처 알림 블록 제거: 아래 JSX 전체 삭제
```tsx
{isNative && (
  <div className="mt-2 flex h-14 items-center justify-between">
    ...근처 알림 토글...
  </div>
)}
```
그리고 더 이상 쓰지 않는 import/상태 정리: `Capacitor`, `Preferences`, `setNearbyAlerts`, `useEffect`, `useState`, `isNative`, `nearby`, `toggleNearby` 제거. (남는 import: `ChevronRight, Settings, User` from lucide, `useNavigate`, `AppBar`, `Button`, `Card`, `useAuthStore`.)

- [ ] **Step 5: Profile 테스트 갱신**

기존 `Profile.test.tsx`는 `'근처 알림'` 스위치를 단언(line 63). 그 블록이 이전되었으므로 해당 테스트를 삭제하거나 Settings로 옮긴다. Profile.test.tsx에서 근처 알림 switch 관련 `it(...)`만 제거. (나머지 단언은 Task 7에서 i18n 적용 후에도 ko로 통과.)

Run: `pnpm vitest run src/routes/Profile.test.tsx`
Expected: 근처 알림 테스트 제거 후 나머지 PASS.

- [ ] **Step 6: App.tsx Settings 라우트/ import 확인 (Task 4 Step 2 반영)**

Task 4 Step 2의 `import { Settings }`와 `/settings` 라우트가 들어가 있는지 확인. 없으면 추가.

Run: `pnpm vitest run src/routes/MainLayout.test.tsx && pnpm tsc --noEmit`
Expected: 타입체크 통과, 테스트 PASS.

- [ ] **Step 7: 커밋**

```bash
git add mobile/src/routes/Settings.tsx mobile/src/routes/Settings.test.tsx mobile/src/routes/Profile.tsx mobile/src/routes/Profile.test.tsx mobile/src/App.tsx
git commit -m "feat(mobile): settings screen with language/theme/nearby-alerts"
```

---

## Task 6: 공용 컴포넌트 + format 문자열 마이그레이션

각 컴포넌트에서 하드코딩 한글을 `t(key)`로 교체. i18n 기본값이 ko이므로 **기존 테스트는 수정 없이 통과**해야 한다(통과 확인이 검증 기준).

**Files:**
- Modify: `mobile/src/shared/components/BottomNav.tsx`
- Modify: `mobile/src/shared/components/Badge.tsx`
- Modify: `mobile/src/shared/components/AppBar.tsx`
- Modify: `mobile/src/shared/components/states/LoadingState.tsx`
- Modify: `mobile/src/features/map/KakaoMap.tsx`
- Modify: `mobile/src/features/splits/SplitCard.tsx`
- Modify: `mobile/src/shared/lib/format.ts`
- Modify: `mobile/src/shared/lib/format.test.ts`

- [ ] **Step 1: BottomNav.tsx — t() 적용**

`useTranslation` 추가, `tabs` 배열의 `label`을 키로 바꾸고 렌더 시 번역.
```tsx
import { useTranslation } from 'react-i18next';
// ...
const tabs: Array<{ key: Tab; icon: LucideIcon; labelKey: string }> = [
  { key: 'home', icon: Home, labelKey: 'nav.home' },
  { key: 'map', icon: Map, labelKey: 'nav.map' },
  { key: 'profile', icon: User, labelKey: 'nav.profile' },
];

export function BottomNav({ current, onSelect }: BottomNavProps) {
  const { t } = useTranslation();
  return (
    // ...map(({ key, icon: Icon, labelKey }) => ... <span ...>{t(labelKey)}</span> ...
  );
}
```
> 정확히: `label: '홈'`→`labelKey: 'nav.home'`, `'지도'`→`'nav.map'`, `'나'`→`'nav.profile'`. 렌더의 `{label}`을 `{t(labelKey)}`로.

- [ ] **Step 2: Badge.tsx — StatusBadge 라벨 t() 적용**

`statusMap`의 `label`을 키로 바꾸고 `StatusBadge`에서 번역.
```tsx
import { useTranslation } from 'react-i18next';
// statusMap: label → labelKey
const statusMap: Record<Status, { tone: Tone; labelKey: string }> = {
  WAITING: { tone: 'brand', labelKey: 'status.waiting' },
  MATCHED: { tone: 'neutral', labelKey: 'status.matched' },
  COMPLETED: { tone: 'neutral', labelKey: 'status.completed' },
  CANCELLED: { tone: 'neutral', labelKey: 'status.cancelled' },
  URGENT: { tone: 'warning', labelKey: 'status.urgent' },
};

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useTranslation();
  const { tone, labelKey } = statusMap[status];
  return <Badge tone={tone}>{t(labelKey)}</Badge>;
}
```
> `Badge`/`Chip`은 children을 받으므로 변경 불필요.

- [ ] **Step 3: AppBar.tsx — 뒤로가기 aria-label t() 적용**

```tsx
import { useTranslation } from 'react-i18next';
// 컴포넌트 본문 상단: const { t } = useTranslation();
// aria-label="뒤로가기" → aria-label={t('aria.back')}
```

- [ ] **Step 4: LoadingState.tsx — 기본 메시지 t() 적용**

기본값 prop을 옵셔널로 바꾸고, 미지정 시 t() 사용:
```tsx
import { useTranslation } from 'react-i18next';
type LoadingStateProps = { message?: string };
export function LoadingState({ message }: LoadingStateProps) {
  const { t } = useTranslation();
  const text = message ?? t('states.loading');
  // ...<p ...>{text}</p>
}
```

- [ ] **Step 5: KakaoMap.tsx — 에러 문구 t() 적용**

`<p ...>지도를 불러올 수 없어요</p>` → `{t('map.loadError')}`. 컴포넌트에 `const { t } = useTranslation();` 추가.

- [ ] **Step 6: SplitCard.tsx — 1인당/모집 문구 t() 적용**

```tsx
import { useTranslation } from 'react-i18next';
// const { t } = useTranslation();
// '1인당 {price}' 라인:
<span className="text-body-em ...">{t('splits.perPersonShort', { price: formatPrice(split.pricePerPerson) })}</span>
// '{count}명 모집' 라인:
<span className="text-caption ...">{t('splits.recruitCount', { count: split.splitCount })}</span>
```
> 주의: ko에서 `splits.perPersonShort = "1인당 {{price}}"`, `recruitCount = "{{count}}명 모집"` → 기존 렌더 `1인당 ₩10,000`, `2명 모집`과 동일 → SplitCard.test 통과.

- [ ] **Step 7: format.ts — formatRelativeTime을 i18n.t로**

`i18n` 인스턴스를 직접 import(컴포넌트 아님). 가격/거리(`formatPrice`,`formatDistance`)는 범위 밖이므로 유지.
```ts
import i18n from '../i18n';

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const min = Math.floor((now.getTime() - then.getTime()) / 60000);
  if (min < 1) return i18n.t('time.justNow');
  if (min < 60) return i18n.t('time.minutesAgo', { count: min });
  const hour = Math.floor(min / 60);
  if (hour < 24) return i18n.t('time.hoursAgo', { count: hour });
  const day = Math.floor(hour / 24);
  if (day < 7) return i18n.t('time.daysAgo', { count: day });
  const y = then.getFullYear();
  const m = String(then.getMonth() + 1).padStart(2, '0');
  const d = String(then.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}
```
> `formatPrice`,`formatDistance`는 그대로 둔다.

- [ ] **Step 8: format.test.ts — i18n 초기화 보장**

`format.test.ts` 상단에 i18n을 ko로 보장하는 import를 추가(setup.ts가 이미 ko로 로드하지만 명시적 안전장치):
```ts
import i18n from '../i18n';
// describe 밖 최상단 또는 beforeAll:
beforeAll(async () => { await i18n.changeLanguage('ko'); });
```
`import { describe, it, expect, beforeAll } from 'vitest';`로 `beforeAll` 추가. 기존 단언값(`방금 전`,`30분 전`,`3시간 전`,`2일 전`,`2026.05.01`)은 ko 사전과 일치하므로 변경 불필요.

- [ ] **Step 9: 전체 관련 테스트 실행 → 통과 확인**

Run:
```bash
pnpm vitest run src/shared/components src/features/map src/features/splits src/shared/lib/format.test.ts src/routes/MainLayout.test.tsx
```
Expected: 모두 PASS (한글 단언 유지 — i18n ko 렌더).

- [ ] **Step 10: 커밋**

```bash
git add mobile/src/shared/components mobile/src/features/map/KakaoMap.tsx mobile/src/features/splits/SplitCard.tsx mobile/src/shared/lib/format.ts mobile/src/shared/lib/format.test.ts
git commit -m "i18n(mobile): migrate shared components + relative time to t()"
```

---

## Task 7: 라우트 화면 문자열 마이그레이션

각 라우트에 `const { t } = useTranslation();` 추가 후 하드코딩 한글을 키로 교체. 기존 테스트는 ko로 통과해야 한다.

**Files:** `Login.tsx, Home.tsx, Map.tsx, Profile.tsx, CreateSplit.tsx, SplitDetail.tsx, SplitList.tsx, AuthCallback.tsx, MainLayout.tsx, Catalog.tsx`

- [ ] **Step 1: Login.tsx**

`PROVIDER_LABEL` 상수를 키 매핑으로 바꾸고 렌더에서 번역. 헤더/서브카피/dev버튼/Apple 에러 toast 교체.
```tsx
import { useTranslation } from 'react-i18next';
const PROVIDER_KEY: Record<Provider, string> = {
  kakao: 'login.kakao', naver: 'login.naver', google: 'login.google', apple: 'login.apple',
};
// 본문: const { t } = useTranslation();
// <p className="text-h2 ...">{t('login.tagline')}</p>
// <p className="text-body ...">{t('login.subtitle')}</p>
// 버튼 텍스트: {t(PROVIDER_KEY[provider])}
// dev 버튼: {t('login.devLogin')}
// toast('Apple 로그인에 실패했어요...') → toast(t('login.appleError'))
```
> 워드마크 `Nthing`(브랜드)은 번역하지 않는다.

- [ ] **Step 2: Home.tsx**

`FILTERS` 라벨을 키로, AppBar/에러/empty/버튼 교체.
```tsx
import { useTranslation } from 'react-i18next';
const FILTERS = [
  { labelKey: 'home.filterAll', status: undefined },
  { labelKey: 'home.filterRecruiting', status: 'WAITING' as SplitStatus },
];
// const { t } = useTranslation();
// <AppBar title={t('home.title')} />
// Chip children: {t(f.labelKey)}  (key prop은 f.labelKey 사용)
// ErrorState message={t('splits.loadError')}
// EmptyState title={t('splits.emptyTitle')} subtitle={t('splits.emptySubtitle')}
// 버튼: {t('common.registerSplit')}
```

- [ ] **Step 3: Map.tsx**

```tsx
// const { t } = useTranslation();
// <AppBar title={t('map.title')} />
// ErrorState message={t('splits.loadError')}
// 버튼: {t('common.join')}
```

- [ ] **Step 4: Profile.tsx**

`MENU` 라벨 키화 + 타이틀/게스트/로그아웃/aria 교체.
```tsx
import { useTranslation } from 'react-i18next';
const MENU = [
  { labelKey: 'profile.mySplits', to: '/me/splits' },
  { labelKey: 'profile.participated', to: '/me/splits/participated' },
];
// const { t } = useTranslation();
// <AppBar title={t('profile.title')} ...>  aria-label={t('aria.settings')}
// {user?.nickname ?? t('common.guest')}
// 메뉴 span: {t(m.labelKey)}  (key는 m.to)
// 로그아웃 버튼: {t('profile.logout')}
```

- [ ] **Step 5: CreateSplit.tsx**

AppBar/사진/필드 라벨·placeholder/에러/미리보기/제출 교체.
```tsx
// const { t } = useTranslation();
// <AppBar title={t('create.title')} ... />
// img alt={t('create.photoAlt')}
// 업로드 중 span: {t('create.uploading')}
// 사진 추가 span: {t('create.addPhoto')}
// setUploadError('사진 업로드에 실패했어요...') → setUploadError(t('create.uploadError'))
// TextField label/placeholder:
//   상품명 → label={t('create.fieldName')} placeholder={t('create.fieldNamePlaceholder')}
//   전체 가격 → t('create.fieldPrice')
//   전체 수량 → t('create.fieldQty')
//   나눌 인원 → t('create.fieldCount'), supportingText={t('create.fieldCountSupport')}
//   주소 → t('create.fieldAddress'), placeholder={t('create.fieldAddressPlaceholder')}
// 1인당 예상 가격 span: {t('create.perPersonEstimate')}
// 제출 버튼: {t('create.title')}  ← 동일 문구 '내 반띵 올리기'
```
> 주의: CreateSplit.test는 `getByLabelText('상품명')`, `'전체 가격'` 등 ko 라벨로 단언 → ko 사전과 일치하여 통과.

- [ ] **Step 6: SplitDetail.tsx**

AppBar 3곳/에러/InfoRow 라벨/단위/마감·취소·참여 버튼 교체.
```tsx
// const { t } = useTranslation();
// 모든 <AppBar title="반띵 상세"> → title={t('detail.title')} (3곳)
// ErrorState message={t('splits.loadError')}
// 1인당: <p ...>{t('detail.perPerson')}</p>
// InfoRow label="전체 가격" → {t('detail.totalPrice')}
// InfoRow label="전체 수량" value={t('common.qty', { count: split.totalQty })}  ← '{count}개'
//   ↑ 기존 value `${split.totalQty}개` 를 t('common.qty',{count})로 교체
// InfoRow label="나눌 인원" value={t('common.people', { count: split.splitCount })} ← '{count}명'
//   라벨도 {t('detail.splitCount')}
// <h2 ...>{t('detail.location')}</h2>
// 마감된 반띵 버튼: {t('detail.closed')}
// 취소하기 버튼: {t('detail.cancel')}
// 반띵할게요 버튼: {t('common.join')}
```
> ko 사전: `common.qty="{{count}}개"`, `common.people="{{count}}명"`. 기존 렌더 `4개`,`2명`과 일치 → SplitDetail.test의 `마감된 반띵`,`반띵할게요`,`취소하기` 단언 통과.

- [ ] **Step 7: SplitList.tsx**

```tsx
import { useTranslation } from 'react-i18next';
// SplitListView에 title prop은 그대로 두되, 호출부에서 t() 전달:
// MySplitList: title={t('profile.mySplits')}
// ParticipatedSplitList: title={t('profile.participated')}
// → 각 함수에서 const { t } = useTranslation();
// ErrorState message={t('list.loadError')}
// EmptyState title={t('splits.emptyTitle')} subtitle={t('splits.emptySubtitle')}
// 버튼: {t('common.registerSplit')}
```
> SplitList.test는 `'내 나눠사기'`,`'참여한 나눠사기'`,`'아직 반띵이 없어요'` 단언 → ko 일치 통과.

- [ ] **Step 8: AuthCallback.tsx**

```tsx
import { useTranslation } from 'react-i18next';
// const { t } = useTranslation();
// <p ...>{failed ? t('auth.callbackFailed') : t('auth.callbackLoading')}</p>
```
> 내부 throw 메시지(`네이버 state 불일치`,`Apple state 불일치`)는 사용자 비노출(catch 후 무시) → 유지.

- [ ] **Step 9: MainLayout.tsx**

```tsx
import { useTranslation } from 'react-i18next';
// const { t } = useTranslation();
// <Fab label={t('common.registerSplit')} ... />
```
> MainLayout.test는 `getByRole('button', { name: '반띵 등록하기' })` → ko 일치 통과.

- [ ] **Step 10: Catalog.tsx (개발용 데모 — 사용자 비노출이지만 일관성 위해 최소 처리)**

Catalog는 개발 카탈로그 화면(라우트 `/catalog`, 비인증). 데모 라벨 다수가 한글이나 사용자 노출이 아니므로 **번역 대상 아님**. 단, 자체 다크 토글(`toggleDark`)이 새 themeStore와 충돌할 수 있으므로 그대로 둔다(독립 데모). 변경 없음.
> 이 스텝은 "변경 없음"을 명시적으로 확인하는 단계다.

- [ ] **Step 11: 라우트 테스트 전체 실행 → 통과 확인**

Run:
```bash
pnpm vitest run src/routes
```
Expected: 모든 라우트 테스트 PASS (Profile은 Task 5에서 근처 알림 테스트 제거됨).

- [ ] **Step 12: 커밋**

```bash
git add mobile/src/routes mobile/src/features/auth/DeepLinkListener.tsx
git commit -m "i18n(mobile): migrate route screens to t()"
```
> (DeepLinkListener에 사용자 노출 문자열 없으면 git add에서 빠져도 무방.)

---

## Task 8: 기능 모듈 토스트/에러 문자열 마이그레이션

**Files:**
- Modify: `mobile/src/features/notifications/PushPrimingSheet.tsx`
- Modify: `mobile/src/shared/api/http.ts`

- [ ] **Step 1: PushPrimingSheet.tsx**

```tsx
import { useTranslation } from 'react-i18next';
// const { t } = useTranslation();
// <h2 ...>{t('push.primingTitle')}</h2>
// <p ...>{t('push.primingBody')}</p>
// <Button onClick={onAccept}>{t('push.primingAccept')}</Button>
// <Button variant="text" onClick={onDismiss}>{t('push.primingLater')}</Button>
```

- [ ] **Step 2: http.ts — 기본 에러 메시지 t() 적용**

`http.ts`는 컴포넌트 아님 → `i18n` 인스턴스 직접 사용.
```ts
import i18n from '../i18n';
// let message = `요청 실패 (${res.status})`;
let message = i18n.t('error.requestFailed', { status: res.status });
```
> 서버가 `err.message`를 주면 그 값으로 덮어쓰는 기존 로직 유지(서버 메시지는 별도 번역 범위 밖).

- [ ] **Step 3: pushService.ts / oauth.ts / appleNative.ts / imagePicker.ts 확인**

이 파일들의 한글은 모두 **주석 또는 내부 throw(비노출)**다:
- `pushService.ts`: 전부 주석 → 변경 없음
- `oauth.ts`: 전부 주석 → 변경 없음
- `appleNative.ts`: `throw new Error('Apple identityToken 을 받지 못했습니다')` → catch되어 generic 처리, 비노출 → 유지
- `imagePicker.ts`: 전부 주석 → 변경 없음
> 이 스텝은 "변경 없음"을 확인하는 단계.

- [ ] **Step 4: 관련 테스트 실행**

Run: `pnpm vitest run src/features/notifications src/shared/api/http.test.ts`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add mobile/src/features/notifications/PushPrimingSheet.tsx mobile/src/shared/api/http.ts
git commit -m "i18n(mobile): migrate push priming + http error message"
```

---

## Task 9: 전체 검증

**Files:** 없음(검증만)

- [ ] **Step 1: 남은 사용자 노출 한글 스캔**

Run (cwd `mobile/`):
```bash
grep -rnP "['\"\`>][^'\"\`<]*[\x{AC00}-\x{D7A3}]" src --include='*.tsx' --include='*.ts' | grep -v '\.test\.' | grep -v '//' | grep -v 'i18n/locales'
```
Expected: JSX/문자열 리터럴의 사용자 노출 한글이 더 이상 없어야 한다(주석/로케일 JSON 제외). 남으면 해당 파일을 t()로 처리.
> Catalog.tsx의 데모 라벨은 의도적으로 제외(개발 전용). 주석 라인의 한글은 무시.

- [ ] **Step 2: 타입체크**

Run: `pnpm tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 린트**

Run: `pnpm lint`
Expected: 에러 없음(또는 기존 baseline과 동일).

- [ ] **Step 4: 전체 테스트**

Run: `pnpm vitest run`
Expected: 전부 PASS.

- [ ] **Step 5: 프로덕션 빌드**

Run: `pnpm build`
Expected: 빌드 성공(번들 생성).

- [ ] **Step 6: 수동 스모크 (dev 서버)**

Run: `pnpm dev` 후 브라우저에서:
1. 로그인 → 프로필 → 톱니 → 설정 진입
2. 언어를 English/日本語/简体中文로 전환하며 홈/상세/설정 텍스트가 즉시 바뀌는지 확인
3. 테마 라이트/다크/시스템 전환 시 배경/텍스트 색이 바뀌는지 확인
4. 앱 새로고침 후 선택한 언어·테마가 유지되는지 확인(Preferences 영속)

- [ ] **Step 7: 최종 커밋(있으면) + 마무리**

```bash
git add -A
git commit -m "chore(mobile): finalize i18n + theme settings"
```

---

## 자기 검토 메모 (작성자 확인용)

- 스펙 커버리지: i18n 인프라(T2), 4개 언어(T2), 테마 light/dark/system + system 실시간(T3), 설정 화면 + 근처알림 이전(T5), 자동 감지+ko 폴백(T2 bootstrap), 전 영역 문자열(T6–T8), 테스트(각 태스크) — 모두 매핑됨.
- 테스트 전략: i18n 기본 ko → 기존 한글 단언 테스트 무수정 통과. 예외는 Profile 근처알림 테스트(이전으로 제거)뿐. format.ts plural/interpolation은 ko 사전이 기존 문자열과 1:1 일치하도록 작성됨.
- 타입 일관성: `Lang`,`ThemeMode`,`changeLanguagePersisted`,`bootstrapI18n`,`useThemeStore` 시그니처가 태스크 간 동일하게 유지됨.
- 범위 밖(YAGNI): 통화/숫자 로케일 포맷, RTL, 원격/지연 로딩, 언어별 폰트 — 명시적 제외.
