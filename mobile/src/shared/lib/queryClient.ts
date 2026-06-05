import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
      // Capacitor WKWebView(https://localhost)에서 navigator.onLine 이 false 로
      // 잡혀 쿼리가 paused 되는 문제 방지 — 항상 네트워크 요청 실행.
      networkMode: 'always',
    },
    mutations: {
      networkMode: 'always',
    },
  },
});
