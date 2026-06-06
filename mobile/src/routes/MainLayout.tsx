import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomNav } from '../shared/components/BottomNav';
import { Fab } from '../shared/components/Fab';
import { useEnsureLocation } from '../features/location/useEnsureLocation';
import { useLocationStore } from '../shared/stores/locationStore';
import { usePushPriming } from '../features/notifications/usePushPriming';
import { PushPrimingSheet } from '../features/notifications/PushPrimingSheet';
import { syncDeviceLocation } from '../features/notifications/pushService';

type Tab = 'home' | 'profile';

const PATH_BY_TAB: Record<Tab, string> = {
  home: '/home',
  profile: '/profile',
};

function tabFromPath(pathname: string): Tab {
  if (pathname.startsWith('/profile')) return 'profile';
  return 'home';
}

export function MainLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const current = tabFromPath(pathname);
  const showFab = current === 'home';

  useEnsureLocation();
  const priming = usePushPriming();

  // 위치가 갱신되면 등록된 기기의 마지막 위치를 서버에 동기화 (네이티브만, best-effort)
  const coords = useLocationStore((s) => s.current);
  useEffect(() => {
    if (coords) void syncDeviceLocation();
  }, [coords]);

  return (
    <div className="relative mx-auto flex h-screen max-w-md flex-col bg-white dark:bg-gray-950">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      {showFab && (
        <Fab
          label={t('common.registerSplit')}
          onClick={() => navigate('/splits/new')}
          className="absolute bottom-20 right-4"
        />
      )}
      <BottomNav current={current} onSelect={(tab) => navigate(PATH_BY_TAB[tab])} />
      <PushPrimingSheet open={priming.open} onAccept={priming.accept} onDismiss={priming.dismiss} />
    </div>
  );
}
