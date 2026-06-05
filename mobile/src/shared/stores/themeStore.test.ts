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
