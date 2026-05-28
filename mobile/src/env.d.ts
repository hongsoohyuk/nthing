/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_KAKAO_REST_KEY?: string;
  readonly VITE_NAVER_CLIENT_ID?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_APPLE_CLIENT_ID?: string;
  readonly VITE_KAKAOMAP_APP_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
