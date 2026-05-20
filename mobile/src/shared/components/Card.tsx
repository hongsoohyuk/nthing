import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

type Padding = 'sm' | 'md' | 'lg';

type CardProps = {
  padding?: Padding;
  interactive?: boolean;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

const paddingClass: Record<Padding, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  padding = 'md',
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-white shadow-card',
        'dark:bg-gray-900 dark:shadow-none dark:border dark:border-gray-700',
        paddingClass[padding],
        interactive &&
          'cursor-pointer transition-shadow hover:shadow-raised active:shadow-card dark:hover:bg-gray-800',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
