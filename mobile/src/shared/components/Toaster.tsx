import { useEffect } from 'react';
import { useToastStore } from '../stores/toastStore';

// 화면 하단 중앙에 뜨는 단일 토스트. message 가 세팅되면 3초 후 자동 dismiss.
export function Toaster() {
  const message = useToastStore((s) => s.message);
  const clear = useToastStore((s) => s.clear);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(clear, 3000);
    return () => clearTimeout(t);
  }, [message, clear]);

  if (!message) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-6"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-md rounded-pill bg-gray-900/95 px-4 py-2.5 text-body text-white shadow-lg dark:bg-gray-100/95 dark:text-gray-900">
        {message}
      </div>
    </div>
  );
}
