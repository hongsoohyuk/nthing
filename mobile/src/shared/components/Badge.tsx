import { type ReactNode } from 'react';
import { cn } from '../lib/cn';

type Tone = 'brand' | 'success' | 'warning' | 'error' | 'neutral';

const toneClass: Record<Tone, string> = {
  brand: 'bg-brand-surface text-brand dark:bg-brand-surface-dark dark:text-brand-dark-adj',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  neutral: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

type BadgeProps = {
  tone?: Tone;
  className?: string;
  children: ReactNode;
};

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-2 py-1 text-meta',
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

type Status = 'WAITING' | 'MATCHED' | 'COMPLETED' | 'CANCELLED' | 'URGENT';

const statusMap: Record<Status, { tone: Tone; label: string }> = {
  WAITING: { tone: 'brand', label: '모집중' },
  MATCHED: { tone: 'neutral', label: '매칭됨' },
  COMPLETED: { tone: 'neutral', label: '완료' },
  CANCELLED: { tone: 'neutral', label: '취소' },
  URGENT: { tone: 'warning', label: '마감임박' },
};

export function StatusBadge({ status }: { status: Status }) {
  const { tone, label } = statusMap[status];
  return <Badge tone={tone}>{label}</Badge>;
}

type ChipProps = {
  active?: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
};

export function Chip({ active = false, onClick, className, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex cursor-pointer items-center rounded-pill border px-3 py-1.5 text-caption transition-colors',
        active
          ? 'border-brand bg-brand text-white dark:border-brand-dark-adj dark:bg-brand-dark-adj'
          : 'border-gray-200 bg-transparent text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900',
        className,
      )}
    >
      {children}
    </button>
  );
}
