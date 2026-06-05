// mobile/src/shared/i18n/bootstrap.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Preferences } from '@capacitor/preferences';
import i18n from './index';
import { bootstrapI18n } from './index';

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

const mockGet = vi.mocked(Preferences.get);

function setNavigatorLanguage(value: string) {
  Object.defineProperty(navigator, 'language', { value, configurable: true });
}

describe('bootstrapI18n', () => {
  const originalLanguage = navigator.language;

  beforeEach(async () => {
    vi.clearAllMocks();
    setNavigatorLanguage(originalLanguage);
    await i18n.changeLanguage('ko');
  });

  it('저장된 유효한 언어가 있으면 그 언어로 설정', async () => {
    mockGet.mockResolvedValueOnce({ value: 'ja' });
    await bootstrapI18n();
    expect(i18n.language).toBe('ja');
  });

  it('저장값이 없으면 navigator 언어로 결정', async () => {
    mockGet.mockResolvedValueOnce({ value: null });
    setNavigatorLanguage('ja-JP');
    await bootstrapI18n();
    expect(i18n.language).toBe('ja');
  });

  it('저장값 없고 navigator 언어가 미지원이면 ko 로 폴백', async () => {
    mockGet.mockResolvedValueOnce({ value: null });
    setNavigatorLanguage('fr-FR');
    await bootstrapI18n();
    expect(i18n.language).toBe('ko');
  });

  it('Preferences.get 이 throw 하면 ko 유지', async () => {
    mockGet.mockRejectedValueOnce(new Error('Preferences unavailable'));
    await bootstrapI18n();
    expect(i18n.language).toBe('ko');
  });
});
