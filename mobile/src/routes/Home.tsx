// TEMP: Phase 1.3 인증 후 착지점. Phase 1.4 에서 MainLayout(AppBar+BottomNav+FAB)으로 교체.
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../shared/stores/authStore';
import { Button } from '../shared/components/Button';

export function Home() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <p className="text-h1 text-gray-900">{user?.nickname ?? '게스트'}님</p>
        <p className="text-body text-gray-500">반띵하자 — 로그인 성공 (임시 화면)</p>
      </div>
      <Button
        variant="secondary"
        onClick={() => {
          void (async () => {
            await logout();
            navigate('/login', { replace: true });
          })();
        }}
      >
        로그아웃
      </Button>
    </div>
  );
}
