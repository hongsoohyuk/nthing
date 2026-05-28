import { useNavigate } from 'react-router-dom';
import { ChevronRight, Settings, User } from 'lucide-react';
import { AppBar } from '../shared/components/AppBar';
import { Card } from '../shared/components/Card';
import { Button } from '../shared/components/Button';
import { useAuthStore } from '../shared/stores/authStore';

const MENU: Array<{ label: string; to: string }> = [
  { label: '내 나눠사기', to: '/me/splits' },
  { label: '참여한 나눠사기', to: '/me/splits/participated' },
];

export function Profile() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

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
            <p className="text-caption text-gray-500">반띵으로 알뜰하게</p>
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

        <div className="mt-8 flex justify-center">
          <Button variant="text" onClick={onLogout}>
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  );
}
