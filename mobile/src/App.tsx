import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './shared/lib/queryClient';
import { setUnauthorizedHandler } from './shared/api/http';
import { useAuthStore } from './shared/stores/authStore';
import { useThemeStore } from './shared/stores/themeStore';
import { bootstrapI18n } from './shared/i18n';
import { DeepLinkListener } from './features/auth/DeepLinkListener';
import { PushListener } from './features/notifications/PushListener';
import { Toaster } from './shared/components/Toaster';
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
import { Settings } from './routes/Settings';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void useAuthStore.getState().logout();
    });
    void Promise.all([
      useAuthStore.getState().hydrate(),
      useThemeStore.getState().hydrate(),
      bootstrapI18n(),
    ])
      .catch(() => {
        // 하이드레이션 실패(예: Preferences 접근 불가)해도 빈 화면에 갇히지 않게 진행.
        // 토큰 복원 실패 시 비로그인 상태로 렌더된다.
      })
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null; // auth/theme/언어 복원 전 공백 (FOUC 방지)

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <DeepLinkListener />
        <PushListener />
        <Toaster />
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
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
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
