import { useEffect, useRef, useState } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { requestPermissionAndRegister } from './pushService';

const ASKED_KEY = 'nthing.push.asked';

// 첫 인증 진입 시 1회만 프라이밍 시트 노출 여부를 관리한다.
export function usePushPriming() {
  const ran = useRef(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!Capacitor.isNativePlatform()) return;
    void (async () => {
      const { value } = await Preferences.get({ key: ASKED_KEY });
      if (!value) setOpen(true);
    })();
  }, []);

  const accept = async () => {
    setOpen(false);
    await Preferences.set({ key: ASKED_KEY, value: '1' });
    await requestPermissionAndRegister();
  };
  const dismiss = async () => {
    setOpen(false);
    await Preferences.set({ key: ASKED_KEY, value: '1' });
  };

  return { open, accept, dismiss };
}
