import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { startOAuth } from '../features/auth/oauth';
import { isAppleNativeAvailable, loginWithAppleNative } from '../features/auth/appleNative';
import { nthingApi } from '../shared/api/nthingApi';
import { useAuthStore } from '../shared/stores/authStore';
import { toast } from '../shared/stores/toastStore';
import { type Provider } from '../shared/api/types';
import { cn } from '../shared/lib/cn';
import pushData from '../features/auth/mockPushSamples.json';
import logoConcept1 from '../assets/brand/logo-concept-1-perforated-n.svg';
import logoConcept2 from '../assets/brand/logo-concept-2-n-pie.svg';
import logoConcept3 from '../assets/brand/logo-concept-3-split-parcel.svg';
import logoConcept4 from '../assets/brand/logo-concept-4-fraction.svg';
import logoConcept4a from '../assets/brand/logo-concept-4a-ligature.svg';
import logoConcept4b from '../assets/brand/logo-concept-4b-chip.svg';
import logoConcept4c from '../assets/brand/logo-concept-4c-smile.svg';
import logoConcept4d from '../assets/brand/logo-concept-4d-coin.svg';

// 히어로/푸시 카드에 쓰는 로고. 기본은 채택안(1번).
// dev 빌드에서만 ?logo=2|3|4|4a|4b|4c|4d 쿼리로 다른 시안을 라이브 비교할 수 있다.
const LOGO_CONCEPTS = {
  '1': logoConcept1,
  '2': logoConcept2,
  '3': logoConcept3,
  '4': logoConcept4,
  '4a': logoConcept4a,
  '4b': logoConcept4b,
  '4c': logoConcept4c,
  '4d': logoConcept4d,
} as const;

function resolveLogoMark(): string {
  if (!import.meta.env.DEV || typeof window === 'undefined') return LOGO_CONCEPTS['1'];
  const pick = new URLSearchParams(window.location.search).get('logo');
  return LOGO_CONCEPTS[(pick ?? '1') as keyof typeof LOGO_CONCEPTS] ?? LOGO_CONCEPTS['1'];
}

// 사용자가 시트를 직접 닫은 경우(취소)는 토스트를 띄우지 않는다.
function isAppleCancel(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /1001|cancel/i.test(msg);
}

type LoginProps = { showDevLogin?: boolean };

// mockPushSamples.json 스키마. 카피는 JSON 파일에서 자유롭게 편집.
type PushSample = { title: string; body: string; distance: string; tag?: string };
const SAMPLES = (pushData.samples as PushSample[]) ?? [];

const PROVIDER_LABEL: Record<Provider, string> = {
  kakao: '카카오로 시작하기',
  naver: '네이버로 시작하기',
  google: 'Google로 시작하기',
  apple: 'Apple로 시작하기',
};

const PROVIDER_CLASS: Record<Provider, string> = {
  kakao: 'bg-[#FEE500] text-[#191600] active:bg-[#F2D900]',
  naver: 'bg-[#03C75A] text-white active:bg-[#02B351]',
  google: 'border border-gray-200 bg-white text-gray-800 active:bg-gray-50',
  apple: 'bg-black text-white active:bg-gray-900',
};

// 로그인 화면 한정 키프레임(전역 토큰/공용 CSS를 건드리지 않도록 컴포넌트 안에 둔다).
const KEYFRAMES = `
@keyframes nthRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
@keyframes nthFloat { 0%,100% { transform: translate(0,0); } 50% { transform: translate(10px,-14px); } }
@keyframes nthFloatAlt { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-12px,10px); } }
`;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M12 21s7-5.686 7-11a7 7 0 1 0-14 0c0 5.314 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** 근처 반띵 푸시 알림 미리보기 — 3초마다 순환(reduced-motion이면 정지). */
function PushDeck({ reduced, logoMark }: { reduced: boolean; logoMark: string }) {
  const [active, setActive] = useState(0);
  const n = SAMPLES.length;

  useEffect(() => {
    if (reduced || n <= 1) return;
    const id = setInterval(() => setActive((a) => (a + 1) % n), 3000);
    return () => clearInterval(id);
  }, [reduced, n]);

  if (n === 0) return null;

  return (
    <div
      aria-hidden
      className="relative mx-auto mt-10 h-[150px] w-full max-w-[340px] [perspective:1000px]"
    >
      {SAMPLES.map((s, i) => {
        const pos = (i - active + n) % n; // 0 = 맨 앞
        const visible = pos <= 2;
        const style: CSSProperties = {
          transform: `translateY(${pos * 14}px) scale(${1 - pos * 0.05})`,
          opacity: visible ? 1 - pos * 0.32 : 0,
          zIndex: n - pos,
          transition: reduced ? undefined : 'transform 500ms cubic-bezier(.22,1,.36,1), opacity 500ms ease',
          pointerEvents: 'none',
        };
        return (
          <div
            key={i}
            style={style}
            className="absolute inset-x-0 top-0 rounded-[20px] border border-white/60 bg-white/95 p-3.5 text-left shadow-overlay backdrop-blur-sm"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-brand-surface">
                <img src={logoMark} alt="" className="size-7" />
              </span>
              <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
                <span className="truncate text-meta font-semibold text-gray-700">
                  Nthing · 반띵
                </span>
                <span className="shrink-0 text-meta text-gray-400">지금</span>
              </div>
            </div>
            <p className="mt-2 line-clamp-1 text-body-em text-gray-900">{s.title}</p>
            <p className="mt-0.5 line-clamp-1 text-caption text-gray-500">{s.body}</p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-pill bg-brand-surface px-2 py-0.5 text-meta font-semibold text-brand-pressed">
                <PinIcon className="size-3" />
                {s.distance}
              </span>
              {s.tag && (
                <span className="rounded-pill bg-gray-100 px-2 py-0.5 text-meta text-gray-500">
                  {s.tag}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProviderGlyph({ provider }: { provider: Provider }) {
  switch (provider) {
    case 'kakao':
      return (
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
          <path d="M12 3.5C6.9 3.5 2.75 6.78 2.75 10.83c0 2.6 1.74 4.88 4.36 6.18-.18.65-.66 2.37-.76 2.74-.12.46.17.45.36.33.15-.1 2.37-1.6 3.33-2.25.64.09 1.3.14 1.96.14 5.1 0 9.25-3.28 9.25-7.33S17.1 3.5 12 3.5Z" />
        </svg>
      );
    case 'naver':
      return (
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
          <path d="M15.2 12.62 8.43 3H3v18h5.8v-9.62L15.57 21H21V3h-5.8z" />
        </svg>
      );
    case 'apple':
      return (
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
          <path d="M16.37 1.43c0 1.14-.49 2.27-1.18 3.08-.74.9-1.99 1.57-2.99 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.57-2.27 1.21-2.98.8-.94 2.14-1.64 3.25-1.68.03.13.05.28.05.43Zm4.56 15.71c-.03.07-.46 1.58-1.51 3.12-.95 1.34-1.94 2.71-3.43 2.71-1.52 0-1.9-.88-3.63-.88-1.7 0-2.3.91-3.67.91-1.38 0-2.33-1.26-3.43-2.8-1.29-1.82-2.32-4.63-2.32-7.28 0-4.28 2.8-6.55 5.55-6.55 1.45 0 2.67.95 3.6.95.87 0 2.22-1.01 3.9-1.01.61 0 2.89.06 4.37 2.19-.13.09-2.38 1.37-2.38 4.19 0 3.26 2.85 4.42 2.95 4.45Z" />
        </svg>
      );
    case 'google':
      return (
        <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.08H42V20H24v8h11.3c-1.65 4.66-6.08 8-11.3 8a12 12 0 1 1 7.96-20.96l5.66-5.66A20 20 0 1 0 44 24c0-1.34-.14-2.65-.4-3.92Z" />
          <path fill="#FF3D00" d="M6.31 14.69l6.57 4.82A12 12 0 0 1 24 12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66A20 20 0 0 0 6.3 14.69Z" />
          <path fill="#4CAF50" d="M24 44c5.17 0 9.86-1.98 13.41-5.19l-6.19-5.24A11.9 11.9 0 0 1 24 36c-5.2 0-9.62-3.32-11.28-7.95l-6.52 5.02A20 20 0 0 0 24 44Z" />
          <path fill="#1976D2" d="M43.6 20.08H42V20H24v8h11.3a12.1 12.1 0 0 1-4.09 5.57l6.19 5.24C36.97 39.2 44 34 44 24c0-1.34-.14-2.65-.4-3.92Z" />
        </svg>
      );
  }
}

export function Login({ showDevLogin = import.meta.env.DEV }: LoginProps) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [busy, setBusy] = useState(false);
  const reduced = usePrefersReducedMotion();
  const logoMark = useMemo(() => resolveLogoMark(), []);

  const rise = (delay: number): CSSProperties =>
    reduced ? {} : { animation: `nthRise .6s cubic-bezier(.22,1,.36,1) both`, animationDelay: `${delay}ms` };

  const providers = useMemo(() => Object.keys(PROVIDER_LABEL) as Provider[], []);

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
          toast('Apple 로그인에 실패했어요. 설정 > Apple 계정 로그인을 확인해 주세요');
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-brand text-white">
      <style>{KEYFRAMES}</style>

      {/* 분위기: 그린 그라데이션 + 떠다니는 블롭 + 점 격자 텍스처 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-pressed via-brand to-[#0E6B33]" />
        <div
          className="absolute -left-16 top-10 size-64 rounded-full bg-[#4ADE80]/40 blur-3xl"
          style={reduced ? undefined : { animation: 'nthFloat 9s ease-in-out infinite' }}
        />
        <div
          className="absolute -right-20 top-44 size-72 rounded-full bg-[#BBF7D0]/25 blur-3xl"
          style={reduced ? undefined : { animation: 'nthFloatAlt 11s ease-in-out infinite' }}
        />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1.4px)',
            backgroundSize: '20px 20px',
            maskImage: 'linear-gradient(to bottom, black, transparent 75%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 75%)',
          }}
        />
      </div>

      {/* 히어로 */}
      <div className="relative flex flex-1 flex-col items-center px-6 pt-16">
        <div className="flex flex-col items-center text-center">
          <span
            className="grid size-16 place-items-center rounded-[20px] bg-white/15 shadow-overlay ring-1 ring-white/25 backdrop-blur-sm"
            style={rise(0)}
          >
            <img src={logoMark} alt="Nthing 로고" className="size-12" />
          </span>
          <h1
            className="mt-5 text-[40px] font-bold leading-none tracking-tight"
            style={rise(60)}
          >
            Nthing
          </h1>
          <p className="mt-3 text-h1 font-bold text-white" style={rise(120)}>
            반띵하자
          </p>
          <p className="mt-1.5 text-body text-white/80" style={rise(180)}>
            근처에서 N분의 1, 같이 사요
          </p>
        </div>

        <div style={rise(260)} className="w-full">
          <PushDeck reduced={reduced} logoMark={logoMark} />
        </div>
      </div>

      {/* 인증 시트 */}
      <div
        className="relative mt-6 rounded-t-[28px] bg-white px-6 pb-9 pt-7 text-gray-900 shadow-overlay"
        style={rise(340)}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-pill bg-gray-200" aria-hidden />
        <div className="space-y-2.5">
          {providers.map((provider) => (
            <button
              key={provider}
              type="button"
              disabled={busy}
              onClick={() => void onProvider(provider)}
              className={cn(
                'relative flex h-[54px] w-full items-center justify-center rounded-xl text-body-em shadow-card transition-[transform,opacity] active:scale-[0.99]',
                'disabled:cursor-not-allowed disabled:opacity-40',
                PROVIDER_CLASS[provider],
              )}
            >
              <span className="absolute left-4 top-1/2 grid size-6 -translate-y-1/2 place-items-center">
                <ProviderGlyph provider={provider} />
              </span>
              {PROVIDER_LABEL[provider]}
            </button>
          ))}

          {showDevLogin && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onDevLogin()}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-dashed border-gray-300 text-caption text-gray-500 disabled:opacity-40"
            >
              테스트 로그인 (개발용)
            </button>
          )}
        </div>

        <p className="mt-5 text-center text-meta leading-relaxed text-gray-400">
          로그인하면 <span className="text-gray-500">이용약관</span>과{' '}
          <span className="text-gray-500">개인정보처리방침</span>에 동의하는 것으로 간주돼요
        </p>
      </div>
    </div>
  );
}
