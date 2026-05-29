import { useEffect, useRef } from 'react';
import { useLocationStore } from '../../shared/stores/locationStore';

// 인증된 탭 진입점(MainLayout)에서 1회 호출. current 가 비어 있을 때만 실 위치를 요청한다.
export function useEnsureLocation(): void {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (useLocationStore.getState().current) return;
    void useLocationStore.getState().request();
  }, []);
}
