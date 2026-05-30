import { describe, it, expect, vi, beforeEach } from 'vitest';

const store: Record<string, string> = {};
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      store[key] = value;
    }),
    get: vi.fn(async ({ key }: { key: string }) => ({ value: store[key] ?? null })),
    remove: vi.fn(async ({ key }: { key: string }) => {
      delete store[key];
    }),
  },
}));
vi.mock('../../features/notifications/pushService', () => ({
  unregisterDevice: vi.fn().mockResolvedValue(undefined),
}));

import { useAuthStore } from './authStore';
import { unregisterDevice } from '../../features/notifications/pushService';

describe('authStore', () => {
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
    useAuthStore.setState({ token: null, user: null, isHydrated: false });
  });

  it('setAuth 는 토큰/유저를 상태와 Preferences 에 저장한다', async () => {
    await useAuthStore
      .getState()
      .setAuth({ token: 'jwt-1', userId: 7, nickname: '엔띵', isNewUser: true });

    const s = useAuthStore.getState();
    expect(s.token).toBe('jwt-1');
    expect(s.user).toEqual({ id: 7, nickname: '엔띵' });
    expect(store['nthing.auth']).toContain('jwt-1');
    expect(JSON.parse(store['nthing.auth'])).toEqual({
      token: 'jwt-1',
      user: { id: 7, nickname: '엔띵' },
    });
  });

  it('hydrate 는 Preferences 에서 복원하고 isHydrated 를 true 로 만든다', async () => {
    store['nthing.auth'] = JSON.stringify({ token: 'jwt-2', user: { id: 3, nickname: '복원' } });
    await useAuthStore.getState().hydrate();

    const s = useAuthStore.getState();
    expect(s.token).toBe('jwt-2');
    expect(s.user).toEqual({ id: 3, nickname: '복원' });
    expect(s.isHydrated).toBe(true);
  });

  it('저장된 게 없으면 hydrate 후 token 은 null, isHydrated 는 true', async () => {
    await useAuthStore.getState().hydrate();
    const s = useAuthStore.getState();
    expect(s.token).toBeNull();
    expect(s.isHydrated).toBe(true);
  });

  it('logout 은 상태와 저장소를 비운다', async () => {
    await useAuthStore
      .getState()
      .setAuth({ token: 'jwt-1', userId: 7, nickname: '엔띵', isNewUser: false });
    await useAuthStore.getState().logout();

    const s = useAuthStore.getState();
    expect(s.token).toBeNull();
    expect(s.user).toBeNull();
    expect(store['nthing.auth']).toBeUndefined();
  });

  it('logout 은 unregisterDevice 를 호출한다', async () => {
    await useAuthStore.getState().logout();
    expect(unregisterDevice).toHaveBeenCalled();
  });
});
