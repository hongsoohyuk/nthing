import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from '../shared/components/BottomNav';
import { Fab } from '../shared/components/Fab';
import { useEnsureLocation } from '../features/location/useEnsureLocation';
import { usePushPriming } from '../features/notifications/usePushPriming';
import { PushPrimingSheet } from '../features/notifications/PushPrimingSheet';

type Tab = 'home' | 'map' | 'profile';

const PATH_BY_TAB: Record<Tab, string> = {
  home: '/home',
  map: '/map',
  profile: '/profile',
};

function tabFromPath(pathname: string): Tab {
  if (pathname.startsWith('/map')) return 'map';
  if (pathname.startsWith('/profile')) return 'profile';
  return 'home';
}

export function MainLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = tabFromPath(pathname);
  const showFab = current === 'home' || current === 'map';

  useEnsureLocation();
  const priming = usePushPriming();

  return (
    <div className="relative mx-auto flex h-screen max-w-md flex-col bg-white dark:bg-gray-950">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      {showFab && (
        <Fab
          label="반띵 등록하기"
          onClick={() => navigate('/splits/new')}
          className="absolute bottom-20 right-4"
        />
      )}
      <BottomNav current={current} onSelect={(tab) => navigate(PATH_BY_TAB[tab])} />
      <PushPrimingSheet open={priming.open} onAccept={priming.accept} onDismiss={priming.dismiss} />
    </div>
  );
}
