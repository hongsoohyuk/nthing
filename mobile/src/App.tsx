import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './shared/lib/queryClient';
import { setUnauthorizedHandler } from './shared/api/http';
import { useAuthStore } from './shared/stores/authStore';
import { DeepLinkListener } from './features/auth/DeepLinkListener';
import { RootRedirect, RequireAuth } from './features/auth/guards';
import { Login } from './routes/Login';
import { AuthCallback } from './routes/AuthCallback';
import { Home } from './routes/Home';
import { Catalog } from './routes/Catalog';

function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void useAuthStore.getState().logout();
    });
    void hydrate();
  }, [hydrate]);

  if (!isHydrated) return null; // 토큰 복원 전 짧은 공백 (스플래시 대체)

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <DeepLinkListener />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/home"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
