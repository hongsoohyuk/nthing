import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 웹 dev 에서 /api 를 로컬 서버(8080)로 프록시 → 브라우저 교차출처(CORS) 회피.
  // 네이티브/프로덕션 빌드 산출물에는 영향 없음(빌드는 VITE_API_BASE_URL 절대값 사용).
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
