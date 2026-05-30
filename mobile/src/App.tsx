import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './shared/lib/queryClient';
import { setUnauthorizedHandler } from './shared/api/http';
import { useAuthStore } from './shared/stores/authStore';
import { DeepLinkListener } from './features/auth/DeepLinkListener';
import { PushListener } from './features/notifications/PushListener';
import { RootRedirect, RequireAuth } from './features/auth/guards';
import { Login } from './routes/Login';
import { AuthCallback } from './routes/AuthCallback';
import { MainLayout } from './routes/MainLayout';
import { Home } from './routes/Home';
import { Map } from './routes/Map';
import { Profile } from './routes/Profile';
import { CreateSplit } from './routes/CreateSplit';
import { SplitDetail } from './routes/SplitDetail';
import { SplitList } from './routes/SplitList';
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
        <PushListener />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* 인증된 3탭 — MainLayout(Outlet + BottomNav + FAB) 아래 중첩 */}
          <Route
            element={
              <RequireAuth>
                <MainLayout />
              </RequireAuth>
            }
          >
            <Route path="/home" element={<Home />} />
            <Route path="/map" element={<Map />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* 인증 필요한 풀스크린 (셸 없음, 자체 AppBar + back) */}
          <Route
            path="/splits/new"
            element={
              <RequireAuth>
                <CreateSplit />
              </RequireAuth>
            }
          />
          <Route
            path="/splits/:id"
            element={
              <RequireAuth>
                <SplitDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/me/splits"
            element={
              <RequireAuth>
                <SplitList variant="my" />
              </RequireAuth>
            }
          />
          <Route
            path="/me/splits/participated"
            element={
              <RequireAuth>
                <SplitList variant="participated" />
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
