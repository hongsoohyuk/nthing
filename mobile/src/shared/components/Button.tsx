import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/cn';

type Variant = 'primary' | 'secondary' | 'text';
type Size = 'md' | 'lg';

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

const variantClass: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-pressed active:bg-brand-pressed dark:bg-brand-dark-adj dark:hover:bg-brand dark:active:bg-brand',
  secondary:
    'border border-gray-200 bg-transparent text-gray-800 hover:bg-gray-50 active:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-900 dark:active:bg-gray-800',
  text: 'bg-transparent text-gray-500 hover:text-gray-700 active:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
};

const sizeClass: Record<Size, string> = {
  lg: 'h-[52px] px-5 text-body-em',
  md: 'h-11 px-4 text-body-em',
};

export function Button({
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variantClass[variant],
        sizeClass[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : children}
    </button>
  );
}
