import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.nthing.app',
  appName: 'Nthing',
  webDir: 'dist',
  server: {
    // iOS WebView origin 을 capacitor://localhost → https://localhost 로.
    // 카카오맵 JS SDK 도메인 등록이 http(s)만 받으므로 iOS 도 등록 가능한 origin 으로 통일.
    // (Android 는 androidScheme 기본값이 이미 'https' → https://localhost)
    iosScheme: 'https',
  },
};

export default config;
