import { Browser } from '@capacitor/browser';
import { env } from '../../shared/lib/env';
import { type Provider } from '../../shared/api/types';

const REDIRECT_BASE = `${env.apiBaseUrl}/auth/callback`; // → .../api/auth/callback/{provider}
export const NAVER_STATE_KEY = 'nthing.naver.state';
export const APPLE_STATE_KEY = 'nthing.apple.state';

function redirectUri(provider: Provider): string {
  return `${REDIRECT_BASE}/${provider}`;
}

// 순수 함수: provider authorize URL 을 만든다.
export function buildAuthorizeUrl(provider: Provider, state?: string): string {
  const redirect = encodeURIComponent(redirectUri(provider));
  switch (provider) {
    case 'kakao':
      return (
        'https://kauth.kakao.com/oauth/authorize' +
        `?client_id=${env.kakaoRestKey}&redirect_uri=${redirect}&response_type=code`
      );
    case 'google':
      return (
        'https://accounts.google.com/o/oauth2/v2/auth' +
        `?client_id=${env.googleClientId}&redirect_uri=${redirect}&response_type=code` +
        `&scope=${encodeURIComponent('openid email profile')}`
      );
    case 'naver':
      return (
        'https://nid.naver.com/oauth2.0/authorize' +
        `?response_type=code&client_id=${env.naverClientId}&redirect_uri=${redirect}` +
        `&state=${encodeURIComponent(state ?? '')}`
      );
    case 'apple':
      // scope(name/email) 요청 시 Apple 은 응답을 form_post(POST) 로 보낸다.
      return (
        'https://appleid.apple.com/auth/authorize' +
        `?client_id=${env.appleClientId}&redirect_uri=${redirect}&response_type=code` +
        `&response_mode=form_post&scope=${encodeURIComponent('name email')}` +
        `&state=${encodeURIComponent(state ?? '')}`
      );
  }
}

// 네이티브: authorize URL 을 인앱 브라우저로 연다. 콜백은 딥링크로 돌아온다.
export async function startOAuth(provider: Provider): Promise<void> {
  let state: string | undefined;
  if (provider === 'naver') {
    state = crypto.randomUUID();
    sessionStorage.setItem(NAVER_STATE_KEY, state);
  } else if (provider === 'apple') {
    state = crypto.randomUUID();
    sessionStorage.setItem(APPLE_STATE_KEY, state);
  }
  const url = buildAuthorizeUrl(provider, state);
  await Browser.open({ url });
}
