import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { syncDeviceLocation } from './pushService';

// 네이티브에서 알림 탭/토큰 갱신을 처리. 웹은 no-op.
export function PushListener() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let tapHandle: PluginListenerHandle | undefined;
    let tokenHandle: PluginListenerHandle | undefined;

    void FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
      const splitId = (event.notification?.data as Record<string, unknown> | undefined)?.splitId;
      if (typeof splitId === 'string' && splitId) navigate(`/splits/${splitId}`);
    }).then((h) => {
      tapHandle = h;
    });

    void FirebaseMessaging.addListener('tokenReceived', () => {
      void syncDeviceLocation(); // 토큰 갱신 시 현재 위치로 재등록
    }).then((h) => {
      tokenHandle = h;
    });

    return () => {
      void tapHandle?.remove();
      void tokenHandle?.remove();
    };
  }, [navigate]);

  return null;
}
