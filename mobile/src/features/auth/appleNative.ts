import { Capacitor } from '@capacitor/core';
import {
  SignInWithApple,
  type SignInWithAppleOptions,
} from '@capacitor-community/apple-sign-in';
import { env } from '../../shared/lib/env';
import { nthingApi } from '../../shared/api/nthingApi';
import { type AuthResponse } from '../../shared/api/types';

// iOS 에서만 네이티브 Sign in with Apple 시트를 띄울 수 있다.
// Android/웹은 oauth.ts 의 웹 리다이렉트 플로우를 쓴다.
export function isAppleNativeAvailable(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

// 네이티브 시트 → identityToken(JWT) → 서버 검증(/auth/apple) → JWT 발급.
// Safari 를 거치지 않고 기기 내부 Apple 계정으로 동작한다.
export async function loginWithAppleNative(): Promise<AuthResponse> {
  const options: SignInWithAppleOptions = {
    clientId: env.appleClientId, // Android/웹 fallback 용 (iOS 네이티브는 번들 ID 사용)
    redirectURI: `${env.apiBaseUrl}/auth/callback/apple`,
    scopes: 'email name',
    state: crypto.randomUUID(),
  };
  const result = await SignInWithApple.authorize(options);
  const idToken = result.response.identityToken;
  if (!idToken) throw new Error('Apple identityToken 을 받지 못했습니다');
  return nthingApi.loginAppleNative(idToken);
}
