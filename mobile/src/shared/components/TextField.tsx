import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  supportingText?: string;
  trailing?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>;

export function TextField({
  label,
  value,
  onChange,
  error,
  supportingText,
  trailing,
  id,
  className,
  disabled,
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hasError = Boolean(error);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={inputId} className="text-meta text-gray-500 dark:text-gray-400">
        {label}
      </label>
      <div
        className={cn(
          'flex h-[52px] items-center rounded-sm border bg-white px-4 transition-colors dark:bg-gray-900',
          hasError
            ? 'border-error ring-1 ring-error'
            : 'border-gray-200 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand dark:border-gray-700',
          disabled && 'opacity-50',
        )}
      >
        <input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          className="flex-1 bg-transparent text-body text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
          {...rest}
        />
        {trailing && <span className="ml-2 flex items-center">{trailing}</span>}
      </div>
      {hasError ? (
        <span className="text-caption text-error">{error}</span>
      ) : supportingText ? (
        <span className="text-caption text-gray-500 dark:text-gray-400">{supportingText}</span>
      ) : null}
    </div>
  );
}
