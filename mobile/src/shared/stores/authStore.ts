import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';
import { setAuthToken } from '../api/http';
import { unregisterDevice } from '../../features/notifications/pushService';
import { type AuthResponse, type AuthUser } from '../api/types';

const STORAGE_KEY = 'nthing.auth';

type PersistedAuth = { token: string; user: AuthUser };

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isHydrated: boolean;
  setAuth: (res: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isHydrated: false,

  setAuth: async (res) => {
    const user: AuthUser = { id: res.userId, nickname: res.nickname };
    setAuthToken(res.token);
    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify({ token: res.token, user } satisfies PersistedAuth),
    });
    set({ token: res.token, user });
  },

  logout: async () => {
    await unregisterDevice(); // 토큰 클리어 전, 인증된 상태에서 서버에 해제 요청 (실패해도 무시)
    setAuthToken(null);
    await Preferences.remove({ key: STORAGE_KEY });
    set({ token: null, user: null });
  },

  hydrate: async () => {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (value) {
      try {
        const parsed = JSON.parse(value) as PersistedAuth;
        setAuthToken(parsed.token);
        set({ token: parsed.token, user: parsed.user, isHydrated: true });
        return;
      } catch {
        // 손상된 값이면 무시하고 비로그인 상태로 진행
      }
    }
    set({ isHydrated: true });
  },
}));
