import { type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../lib/cn';

type FabProps = {
  onClick: () => void;
  label: string;
  icon?: ReactNode;
  className?: string;
};

export function Fab({ onClick, label, icon, className }: FabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'inline-flex size-14 items-center justify-center rounded-full bg-brand text-white shadow-raised transition-colors',
        'hover:bg-brand-pressed active:bg-brand-pressed dark:bg-brand-dark-adj',
        className,
      )}
    >
      {icon ?? <Plus className="size-6" aria-hidden />}
    </button>
  );
}
