export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  kakaoRestKey: import.meta.env.VITE_KAKAO_REST_KEY ?? '',
  naverClientId: import.meta.env.VITE_NAVER_CLIENT_ID ?? '',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  appleClientId: import.meta.env.VITE_APPLE_CLIENT_ID ?? '',
} as const;
