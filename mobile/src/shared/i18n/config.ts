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
