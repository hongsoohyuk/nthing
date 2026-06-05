import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { ChevronRight, Settings, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setNearbyAlerts } from '../features/notifications/pushService';
import { AppBar } from '../shared/components/AppBar';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { useAuthStore } from '../shared/stores/authStore';

const MENU: Array<{ label: string; to: string }> = [
  { label: '내 나눠사기', to: '/me/splits' },
  { label: '참여한 나눠사기', to: '/me/splits/participated' },
];

export function Profile() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isNative = Capacitor.isNativePlatform();
  const [nearby, setNearby] = useState(true);

  useEffect(() => {
    if (!isNative) return;
    void (async () => {
      const { value } = await Preferences.get({ key: 'nthing.push.nearby' });
      if (value !== null) setNearby(value === '1');
    })();
  }, [isNative]);

  const toggleNearby = () => {
    const next = !nearby;
    setNearby(next);
    void Preferences.set({ key: 'nthing.push.nearby', value: next ? '1' : '0' });
    void setNearbyAlerts(next);
  };

  const onLogout = () => {
    void (async () => {
      await logout();
      navigate('/login', { replace: true });
    })();
  };

  return (
    <div>
      <AppBar
        title="나의 반띵"
        actions={
          <button
            type="button"
            aria-label="설정"
            className="inline-flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            <Settings className="size-5 text-gray-700 dark:text-gray-200" />
          </button>
        }
      />

      <div className="px-4">
        <Card className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <User className="size-7 text-gray-400" aria-hidden />
          </div>
          <div>
            <p className="text-h1 text-gray-900 dark:text-gray-50">{user?.nickname ?? '게스트'}</p>
          </div>
        </Card>

        <ul className="mt-6 divide-y divide-gray-100 dark:divide-gray-800">
          {MENU.map((m) => (
            <li key={m.to}>
              <button
                type="button"
                onClick={() => navigate(m.to)}
                className="flex h-14 w-full items-center justify-between"
              >
                <span className="text-body text-gray-900 dark:text-gray-100">{m.label}</span>
                <ChevronRight className="size-5 text-gray-400" aria-hidden />
              </button>
            </li>
          ))}
        </ul>

        {isNative && (
          <div className="mt-2 flex h-14 items-center justify-between">
            <span className="text-body text-gray-900 dark:text-gray-100">근처 알림</span>
            <button
              type="button"
              role="switch"
              aria-checked={nearby}
              aria-label="근처 알림"
              onClick={toggleNearby}
              className={`inline-flex h-6 w-11 items-center rounded-pill px-0.5 transition-colors ${
                nearby ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <span
                className={`size-5 rounded-full bg-white shadow transition-transform ${
                  nearby ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Button variant="text" onClick={onLogout}>
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  );
}
