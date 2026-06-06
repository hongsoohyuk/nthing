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
