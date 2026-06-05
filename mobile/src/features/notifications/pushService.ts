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
  try {
    // iOS 시뮬레이터/APNs 미설정 환경에선 getToken 이 "No APNS token" 으로 실패.
    // 푸시는 best-effort 라 실패해도 앱 흐름을 막지 않는다.
    const { token } = await FirebaseMessaging.getToken();
    const loc = useLocationStore.getState().current;
    await nthingApi.registerDevice({ fcmToken: token, platform, lat: loc?.lat, lng: loc?.lng });
    return true;
  } catch {
    return false;
  }
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
  try {
    const { token } = await FirebaseMessaging.getToken();
    await nthingApi.registerDevice({ fcmToken: token, platform, nearbyAlertsEnabled: enabled });
  } catch {
    // 미등록(권한 미허용) 상태에서 토글 시 getToken 거부 → 무시 (best-effort)
  }
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
