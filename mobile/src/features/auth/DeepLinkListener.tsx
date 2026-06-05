import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import type { PluginListenerHandle } from '@capacitor/core';
import { parseAuthCallback } from './deepLink';

// 네이티브에서 nthing://auth/callback 딥링크를 받아 라우터 /auth/callback 으로 넘긴다.
export function DeepLinkListener() {
  const navigate = useNavigate();

  useEffect(() => {
    let handle: PluginListenerHandle | undefined;
    void CapApp.addListener('appUrlOpen', (event) => {
      const parsed = parseAuthCallback(event.url);
      if (!parsed) return;
      // 인앱 브라우저(SFSafariViewController/Custom Tab)를 닫는다.
      // 안 닫으면 nthing:// 를 못 그려서 흰 화면이 위에 남는다.
      void Browser.close();
      const qs = new URLSearchParams();
      qs.set('provider', parsed.provider);
      if (parsed.code) qs.set('code', parsed.code);
      if (parsed.state) qs.set('state', parsed.state);
      if (parsed.error) qs.set('error', parsed.error);
      if (parsed.user) qs.set('user', parsed.user);
      navigate(`/auth/callback?${qs.toString()}`, { replace: true });
    }).then((h) => {
      handle = h;
    });
    return () => {
      void handle?.remove();
    };
  }, [navigate]);

  return null;
}
