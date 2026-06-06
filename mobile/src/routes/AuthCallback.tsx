import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { nthingApi } from '../shared/api/nthingApi';
import { useAuthStore } from '../shared/stores/authStore';
import { NAVER_STATE_KEY, APPLE_STATE_KEY } from '../features/auth/oauth';
import { type AuthResponse, type Provider } from '../shared/api/types';

async function exchange(
  provider: Provider,
  code: string,
  state: string | null,
  user: string | null,
): Promise<AuthResponse> {
  switch (provider) {
    case 'kakao':
      return nthingApi.loginKakao(code);
    case 'google':
      return nthingApi.loginGoogle(code);
    case 'naver': {
      const expected = sessionStorage.getItem(NAVER_STATE_KEY);
      sessionStorage.removeItem(NAVER_STATE_KEY);
      if (!state || state !== expected) throw new Error('네이버 state 불일치');
      return nthingApi.loginNaver(code, state);
    }
    case 'apple': {
      const expected = sessionStorage.getItem(APPLE_STATE_KEY);
      sessionStorage.removeItem(APPLE_STATE_KEY);
      if (!state || state !== expected) throw new Error('Apple state 불일치');
      return nthingApi.loginApple(code, user);
    }
  }
}

export function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const ran = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode 이중 실행 방지
    ran.current = true;

    const provider = params.get('provider') as Provider | null;
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    const user = params.get('user');

    if (!provider || error || !code) {
      navigate('/login', { replace: true });
      return;
    }

    void (async () => {
      try {
        const res = await exchange(provider, code, state, user);
        await setAuth(res);
        navigate('/home', { replace: true });
      } catch {
        setFailed(true);
        navigate('/login', { replace: true });
      }
    })();
  }, [params, navigate, setAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-body text-gray-500">{failed ? t('auth.callbackFailed') : t('auth.callbackLoading')}</p>
    </div>
  );
}
