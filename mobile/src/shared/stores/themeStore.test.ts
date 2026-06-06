// mobile/src/shared/stores/themeStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Preferences } from '@capacitor/preferences';
import { useThemeStore } from './themeStore';

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn().mockResolvedValue({ value: null }),
    set: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('themeStore', () => {
  beforeEach(() => {
    // 모듈 레벨 mql/listener 를 system→light 전환으로 확실히 해제 → 테스트 간 누수 방지.
    useThemeStore.getState().setMode('light');
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

  it('hydrate 는 저장된 dark 를 반영하고 클래스도 적용', async () => {
    vi.mocked(Preferences.get).mockResolvedValueOnce({ value: 'dark' });
    await useThemeStore.getState().hydrate();
    expect(useThemeStore.getState().mode).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('system 모드에서 OS 변경 이벤트가 클래스를 갱신', () => {
    let captured: ((e: MediaQueryListEvent) => void) | null = null;
    let matches = false;
    const original = window.matchMedia;
    window.matchMedia = ((q: string) =>
      ({
        get matches() {
          return matches;
        },
        media: q,
        onchange: null,
        addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
          captured = cb;
        },
        removeEventListener: () => {
          captured = null;
        },
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList) as unknown as typeof window.matchMedia;

    try {
      useThemeStore.getState().setMode('system'); // matches=false → dark 미적용
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      matches = true;
      // 클로저 내 대입으로 TS 가 captured 를 never 로 좁히는 문제 → 호출부에서 캐스팅
      (captured as ((e: MediaQueryListEvent) => void) | null)?.({
        matches: true,
      } as MediaQueryListEvent); // applyClass('system') 가 prefersDark 재평가
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    } finally {
      useThemeStore.getState().setMode('light'); // 리스너 해제 → 다른 테스트 누수 방지
      window.matchMedia = original;
    }
  });
});
