import { Home, Map, User, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';

type Tab = 'home' | 'map' | 'profile';

type BottomNavProps = {
  current: Tab;
  onSelect: (tab: Tab) => void;
};

const tabs: Array<{ key: Tab; icon: LucideIcon; labelKey: string }> = [
  { key: 'home', icon: Home, labelKey: 'nav.home' },
  { key: 'map', icon: Map, labelKey: 'nav.map' },
  { key: 'profile', icon: User, labelKey: 'nav.profile' },
];

export function BottomNav({ current, onSelect }: BottomNavProps) {
  const { t } = useTranslation();
  return (
    <nav className="flex min-h-16 items-stretch border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-gray-700 dark:bg-gray-950">
      {tabs.map(({ key, icon: Icon, labelKey }) => {
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
              {t(labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
