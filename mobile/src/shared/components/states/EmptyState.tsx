import { type ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function EmptyState({ title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <h2 className="text-h2 text-gray-700 dark:text-gray-100">{title}</h2>
      {subtitle && <p className="text-body text-gray-500 dark:text-gray-400">{subtitle}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
