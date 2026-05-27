import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../shared/stores/authStore';

// "/" 진입 시 토큰 유무로 분기
export function RootRedirect() {
  const token = useAuthStore((s) => s.token);
  return <Navigate to={token ? '/home' : '/login'} replace />;
}

// 인증 필요한 라우트 감싸기
export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
