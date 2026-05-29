import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    getCurrentPosition: vi.fn(),
  },
}));

import { Geolocation } from '@capacitor/geolocation';
import { useLocationStore, DEFAULT_COORDS } from './locationStore';

const geo = Geolocation as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe('locationStore', () => {
  beforeEach(() => useLocationStore.setState({ current: null }));

  it('초기 current 는 null', () => {
    expect(useLocationStore.getState().current).toBeNull();
  });

  it('setCurrent 가 좌표를 보관한다', () => {
    useLocationStore.getState().setCurrent({ lat: 37.1, lng: 127.2 });
    expect(useLocationStore.getState().current).toEqual({ lat: 37.1, lng: 127.2 });
  });

  it('DEFAULT_COORDS 는 서울시청', () => {
    expect(DEFAULT_COORDS).toEqual({ lat: 37.5665, lng: 126.978 });
  });
});

describe('locationStore.request', () => {
  beforeEach(() => {
    useLocationStore.setState({ current: null });
    geo.checkPermissions.mockReset();
    geo.requestPermissions.mockReset();
    geo.getCurrentPosition.mockReset();
  });

  it('권한 granted + 위치 성공 → setCurrent 하고 true 반환', async () => {
    geo.checkPermissions.mockResolvedValue({ location: 'granted' });
    geo.getCurrentPosition.mockResolvedValue({ coords: { latitude: 37.1, longitude: 127.2 } });

    const ok = await useLocationStore.getState().request();

    expect(ok).toBe(true);
    expect(useLocationStore.getState().current).toEqual({ lat: 37.1, lng: 127.2 });
  });

  it('권한 prompt → requestPermissions granted 면 위치 캡처', async () => {
    geo.checkPermissions.mockResolvedValue({ location: 'prompt' });
    geo.requestPermissions.mockResolvedValue({ location: 'granted' });
    geo.getCurrentPosition.mockResolvedValue({ coords: { latitude: 1, longitude: 2 } });

    const ok = await useLocationStore.getState().request();

    expect(geo.requestPermissions).toHaveBeenCalled();
    expect(ok).toBe(true);
    expect(useLocationStore.getState().current).toEqual({ lat: 1, lng: 2 });
  });

  it('권한 거부 → false, current 유지(null)', async () => {
    geo.checkPermissions.mockResolvedValue({ location: 'denied' });
    geo.requestPermissions.mockResolvedValue({ location: 'denied' });

    const ok = await useLocationStore.getState().request();

    expect(ok).toBe(false);
    expect(useLocationStore.getState().current).toBeNull();
  });

  it('getCurrentPosition 예외 → false, current 유지', async () => {
    geo.checkPermissions.mockResolvedValue({ location: 'granted' });
    geo.getCurrentPosition.mockRejectedValue(new Error('timeout'));

    const ok = await useLocationStore.getState().request();

    expect(ok).toBe(false);
    expect(useLocationStore.getState().current).toBeNull();
  });

  it('DEFAULT_COORDS 는 서울시청 (회귀)', () => {
    expect(DEFAULT_COORDS).toEqual({ lat: 37.5665, lng: 126.978 });
  });
});
