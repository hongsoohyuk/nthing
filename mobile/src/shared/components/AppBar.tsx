import { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../lib/cn';

type AppBarProps = {
  title: string;
  onBack?: () => void;
  actions?: ReactNode;
  transparent?: boolean;
  align?: 'left' | 'center';
};

export function AppBar({
  title,
  onBack,
  actions,
  transparent = false,
  align = 'left',
}: AppBarProps) {
  return (
    <header
      className={cn(
        // pt-[env(safe-area-inset-top)] 로 노치/다이내믹 아일랜드 아래로 내림
        'flex min-h-14 items-center px-2 pt-[env(safe-area-inset-top)]',
        !transparent && 'bg-white dark:bg-gray-950',
      )}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로가기"
          className="inline-flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
        >
          <ArrowLeft className="size-5 text-gray-900 dark:text-gray-50" />
        </button>
      ) : (
        <span className="w-2" aria-hidden />
      )}
      <h1
        className={cn(
          'px-2 text-h1 text-gray-900 dark:text-gray-50',
          align === 'center' && 'flex-1 text-center',
          align === 'left' && 'flex-1',
        )}
      >
        {title}
      </h1>
      {actions && <div className="flex items-center gap-1 pr-2">{actions}</div>}
    </header>
  );
}
