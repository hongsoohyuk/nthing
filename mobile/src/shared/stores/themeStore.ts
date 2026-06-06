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
