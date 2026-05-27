import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
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
      const qs = new URLSearchParams();
      qs.set('provider', parsed.provider);
      if (parsed.code) qs.set('code', parsed.code);
      if (parsed.state) qs.set('state', parsed.state);
      if (parsed.error) qs.set('error', parsed.error);
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
