import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startOAuth } from '../features/auth/oauth';
import { nthingApi } from '../shared/api/nthingApi';
import { useAuthStore } from '../shared/stores/authStore';
import { type Provider } from '../shared/api/types';
import { cn } from '../shared/lib/cn';

type LoginProps = { showDevLogin?: boolean };

const PROVIDER_LABEL: Record<Provider, string> = {
  kakao: '카카오로 시작하기',
  naver: '네이버로 시작하기',
  google: 'Google로 시작하기',
  apple: 'Apple로 시작하기',
};

const PROVIDER_CLASS: Record<Provider, string> = {
  kakao: 'bg-[#FEE500] text-[#191600]',
  naver: 'bg-[#03C75A] text-white',
  google: 'border border-gray-300 bg-white text-gray-800',
  apple: 'bg-black text-white',
};

export function Login({ showDevLogin = import.meta.env.DEV }: LoginProps) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [busy, setBusy] = useState(false);

  const onProvider = async (provider: Provider) => {
    if (provider === 'apple') return; // 준비 중
    await startOAuth(provider);
  };

  const onDevLogin = async () => {
    setBusy(true);
    try {
      const res = await nthingApi.devLogin();
      await setAuth(res);
      navigate('/home', { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between px-6 pb-10 pt-24">
      <header className="space-y-3">
        <h1 className="text-display text-brand">Nthing</h1>
        <p className="text-h2 text-gray-900">반띵하자</p>
        <p className="text-body text-gray-500">근처에서 N분의 1, 같이 사요</p>
      </header>

      <div className="space-y-3">
        {(Object.keys(PROVIDER_LABEL) as Provider[]).map((provider) => {
          const isApple = provider === 'apple';
          return (
            <button
              key={provider}
              type="button"
              disabled={isApple || busy}
              onClick={() => void onProvider(provider)}
              className={cn(
                'flex h-[52px] w-full items-center justify-center rounded-md text-body-em transition-opacity',
                'disabled:cursor-not-allowed disabled:opacity-40',
                PROVIDER_CLASS[provider],
              )}
            >
              {PROVIDER_LABEL[provider]}
              {isApple && <span className="ml-2 text-meta opacity-70">(준비 중)</span>}
            </button>
          );
        })}

        {showDevLogin && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onDevLogin()}
            className="flex h-11 w-full items-center justify-center rounded-md border border-dashed border-gray-300 text-caption text-gray-500 disabled:opacity-40"
          >
            테스트 로그인 (개발용)
          </button>
        )}
      </div>
    </div>
  );
}
