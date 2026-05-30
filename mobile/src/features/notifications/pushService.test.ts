import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: vi.fn() } }));
vi.mock('@capacitor-firebase/messaging', () => ({
  FirebaseMessaging: { requestPermissions: vi.fn(), getToken: vi.fn() },
}));
vi.mock('../../shared/api/nthingApi', () => ({
  nthingApi: { registerDevice: vi.fn(), unregisterDevice: vi.fn() },
}));

import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { nthingApi } from '../../shared/api/nthingApi';
import { useLocationStore } from '../../shared/stores/locationStore';
import { requestPermissionAndRegister, devicePlatform } from './pushService';

const getPlatform = Capacitor.getPlatform as unknown as ReturnType<typeof vi.fn>;
const requestPermissions = FirebaseMessaging.requestPermissions as unknown as ReturnType<
  typeof vi.fn
>;
const getToken = FirebaseMessaging.getToken as unknown as ReturnType<typeof vi.fn>;
const registerDevice = nthingApi.registerDevice as unknown as ReturnType<typeof vi.fn>;

describe('pushService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLocationStore.setState({ current: { lat: 37.5, lng: 127.0 } });
  });

  it('웹이면 no-op (false)', async () => {
    getPlatform.mockReturnValue('web');
    expect(devicePlatform()).toBeNull();
    expect(await requestPermissionAndRegister()).toBe(false);
    expect(registerDevice).not.toHaveBeenCalled();
  });

  it('권한 허용 → 토큰 + 위치로 등록', async () => {
    getPlatform.mockReturnValue('android');
    requestPermissions.mockResolvedValue({ receive: 'granted' });
    getToken.mockResolvedValue({ token: 'tok-1' });
    registerDevice.mockResolvedValue({ id: 1 });

    expect(await requestPermissionAndRegister()).toBe(true);
    expect(registerDevice).toHaveBeenCalledWith({
      fcmToken: 'tok-1',
      platform: 'ANDROID',
      lat: 37.5,
      lng: 127.0,
    });
  });

  it('권한 거부 → 등록 안 함', async () => {
    getPlatform.mockReturnValue('ios');
    requestPermissions.mockResolvedValue({ receive: 'denied' });
    expect(await requestPermissionAndRegister()).toBe(false);
    expect(registerDevice).not.toHaveBeenCalled();
  });
});
