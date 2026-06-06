import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { startOAuth } from '../features/auth/oauth';
import { isAppleNativeAvailable, loginWithAppleNative } from '../features/auth/appleNative';
import { nthingApi } from '../shared/api/nthingApi';
import { useAuthStore } from '../shared/stores/authStore';
import { toast } from '../shared/stores/toastStore';
import { type Provider } from '../shared/api/types';
import { cn } from '../shared/lib/cn';

// 사용자가 시트를 직접 닫은 경우(취소)는 토스트를 띄우지 않는다.
function isAppleCancel(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /1001|cancel/i.test(msg);
}

type LoginProps = { showDevLogin?: boolean };

const PROVIDER_KEY: Record<Provider, string> = {
  kakao: 'login.kakao',
  naver: 'login.naver',
  google: 'login.google',
  apple: 'login.apple',
};

const PROVIDER_CLASS: Record<Provider, string> = {
  kakao: 'bg-[#FEE500] text-[#191600]',
  naver: 'bg-[#03C75A] text-white',
  google: 'border border-gray-300 bg-white text-gray-800',
  apple: 'bg-black text-white',
};

export function Login({ showDevLogin = import.meta.env.DEV }: LoginProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [busy, setBusy] = useState(false);

  const onProvider = async (provider: Provider) => {
    // iOS 는 네이티브 Apple 시트(Safari 미경유) 사용, 나머지는 웹 리다이렉트.
    if (provider === 'apple' && isAppleNativeAvailable()) {
      setBusy(true);
      try {
        const res = await loginWithAppleNative();
        await setAuth(res);
        navigate('/home', { replace: true });
      } catch (e) {
        if (!isAppleCancel(e)) {
          toast(t('login.appleError'));
        }
      } finally {
        setBusy(false);
      }
      return;
    }
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
        <p className="text-h2 text-gray-900">{t('login.tagline')}</p>
        <p className="text-body text-gray-500">{t('login.subtitle')}</p>
      </header>

      <div className="space-y-3">
        {(Object.keys(PROVIDER_KEY) as Provider[]).map((provider) => (
          <button
            key={provider}
            type="button"
            disabled={busy}
            onClick={() => void onProvider(provider)}
            className={cn(
              'flex h-[52px] w-full items-center justify-center rounded-md text-body-em transition-opacity',
              'disabled:cursor-not-allowed disabled:opacity-40',
              PROVIDER_CLASS[provider],
            )}
          >
            {t(PROVIDER_KEY[provider])}
          </button>
        ))}

        {showDevLogin && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onDevLogin()}
            className="flex h-11 w-full items-center justify-center rounded-md border border-dashed border-gray-300 text-caption text-gray-500 disabled:opacity-40"
          >
            {t('login.devLogin')}
          </button>
        )}
      </div>
    </div>
  );
}
