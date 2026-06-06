import { Home, User, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

type Tab = 'home' | 'profile';

type BottomNavProps = {
  current: Tab;
  onSelect: (tab: Tab) => void;
};

const tabs: Array<{ key: Tab; icon: LucideIcon; label: string }> = [
  { key: 'home', icon: Home, label: '홈' },
  { key: 'profile', icon: User, label: '나' },
];

export function BottomNav({ current, onSelect }: BottomNavProps) {
  return (
    <nav className="flex min-h-16 items-stretch border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-gray-700 dark:bg-gray-950">
      {tabs.map(({ key, icon: Icon, label }) => {
        const isActive = key === current;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-current={isActive ? 'page' : undefined}
            className="flex flex-1 flex-col items-center justify-center gap-1"
          >
            <Icon
              className={cn(
                'size-6',
                isActive ? 'text-brand dark:text-brand-dark-adj' : 'text-gray-400',
              )}
            />
            <span
              className={cn(
                'text-meta',
                isActive ? 'font-semibold text-brand dark:text-brand-dark-adj' : 'text-gray-400',
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
