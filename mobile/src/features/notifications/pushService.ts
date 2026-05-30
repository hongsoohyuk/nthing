import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { nthingApi } from '../../shared/api/nthingApi';
import { useLocationStore } from '../../shared/stores/locationStore';
import type { DevicePlatform } from '../../shared/api/types';

export function devicePlatform(): DevicePlatform | null {
  const p = Capacitor.getPlatform();
  if (p === 'ios') return 'IOS';
  if (p === 'android') return 'ANDROID';
  return null; // web → no-op
}

export async function requestPermissionAndRegister(): Promise<boolean> {
  const platform = devicePlatform();
  if (!platform) return false;
  const perm = await FirebaseMessaging.requestPermissions();
  if (perm.receive !== 'granted') return false;
  const { token } = await FirebaseMessaging.getToken();
  const loc = useLocationStore.getState().current;
  await nthingApi.registerDevice({ fcmToken: token, platform, lat: loc?.lat, lng: loc?.lng });
  return true;
}

export async function syncDeviceLocation(): Promise<void> {
  const platform = devicePlatform();
  if (!platform) return;
  const loc = useLocationStore.getState().current;
  if (!loc) return;
  try {
    const { token } = await FirebaseMessaging.getToken();
    await nthingApi.registerDevice({ fcmToken: token, platform, lat: loc.lat, lng: loc.lng });
  } catch {
    // 권한/토큰 없음 → 무시 (등록 전이면 위치 동기화도 스킵)
  }
}

export async function setNearbyAlerts(enabled: boolean): Promise<void> {
  const platform = devicePlatform();
  if (!platform) return;
  const { token } = await FirebaseMessaging.getToken();
  await nthingApi.registerDevice({ fcmToken: token, platform, nearbyAlertsEnabled: enabled });
}

export async function unregisterDevice(): Promise<void> {
  const platform = devicePlatform();
  if (!platform) return;
  try {
    const { token } = await FirebaseMessaging.getToken();
    await nthingApi.unregisterDevice(token);
  } catch {
    // best-effort
  }
}
