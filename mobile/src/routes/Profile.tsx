import { ChevronRight, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppBar } from '../shared/components/AppBar';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { useAuthStore } from '../shared/stores/authStore';

const MENU: Array<{ labelKey: string; to: string }> = [
  { labelKey: 'profile.mySplits', to: '/me/splits' },
  { labelKey: 'profile.participated', to: '/me/splits/participated' },
];

export function Profile() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const onLogout = () => {
    void (async () => {
      await logout();
      navigate('/login', { replace: true });
    })();
  };

  return (
    <div>
      <AppBar
        title={t('profile.title')}
        actions={
          <button
            type="button"
            aria-label={t('aria.settings')}
            onClick={() => navigate('/settings')}
            className="inline-flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            <Settings className="size-5 text-gray-700 dark:text-gray-200" />
          </button>
        }
      />

      <div className="px-4">
        <Card className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <User className="size-7 text-gray-400" aria-hidden />
          </div>
          <div>
            <p className="text-h1 text-gray-900 dark:text-gray-50">{user?.nickname ?? t('common.guest')}</p>
          </div>
        </Card>

        <ul className="mt-6 divide-y divide-gray-100 dark:divide-gray-800">
          {MENU.map((m) => (
            <li key={m.to}>
              <button
                type="button"
                onClick={() => navigate(m.to)}
                className="flex h-14 w-full items-center justify-between"
              >
                <span className="text-body text-gray-900 dark:text-gray-100">{t(m.labelKey)}</span>
                <ChevronRight className="size-5 text-gray-400" aria-hidden />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex justify-center">
          <Button variant="text" onClick={onLogout}>
            {t('profile.logout')}
          </Button>
        </div>
      </div>
    </div>
  );
}
