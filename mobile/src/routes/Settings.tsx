// mobile/src/routes/Settings.tsx
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { setNearbyAlerts } from '../features/notifications/pushService';
import { changeLanguagePersisted } from '../shared/i18n';
import { LANG_LABEL, SUPPORTED_LANGS, type Lang } from '../shared/i18n/config';
import { AppBar } from '../shared/components/AppBar';
import { Card } from '../shared/components/Card';
import { useThemeStore, type ThemeMode } from '../shared/stores/themeStore';

function Row({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex h-12 w-full items-center justify-between"
    >
      <span className="text-body text-gray-900 dark:text-gray-100">{label}</span>
      {selected && <Check className="size-5 text-brand dark:text-brand-dark-adj" aria-hidden />}
    </button>
  );
}

export function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const isNative = Capacitor.isNativePlatform();
  const [nearby, setNearby] = useState(true);

  useEffect(() => {
    if (!isNative) return;
    void (async () => {
      const { value } = await Preferences.get({ key: 'nthing.push.nearby' });
      if (value !== null) setNearby(value === '1');
    })();
  }, [isNative]);

  const toggleNearby = () => {
    const next = !nearby;
    setNearby(next);
    void Preferences.set({ key: 'nthing.push.nearby', value: next ? '1' : '0' });
    void setNearbyAlerts(next);
  };

  const themes: ThemeMode[] = ['light', 'dark', 'system'];
  const themeLabel: Record<ThemeMode, string> = {
    light: t('settings.themeLight'),
    dark: t('settings.themeDark'),
    system: t('settings.themeSystem'),
  };

  return (
    <div className="flex h-screen flex-col">
      <AppBar title={t('settings.title')} onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto px-4 py-2">
        <div className="space-y-6">
          <section>
            <h2 className="mb-1 text-caption text-gray-500">{t('settings.languageSection')}</h2>
            <Card>
              {SUPPORTED_LANGS.map((lang: Lang) => (
                <Row
                  key={lang}
                  label={LANG_LABEL[lang]}
                  selected={i18n.language === lang}
                  onClick={() => void changeLanguagePersisted(lang)}
                />
              ))}
            </Card>
          </section>

          <section>
            <h2 className="mb-1 text-caption text-gray-500">{t('settings.themeSection')}</h2>
            <Card>
              {themes.map((m) => (
                <Row key={m} label={themeLabel[m]} selected={mode === m} onClick={() => setMode(m)} />
              ))}
            </Card>
          </section>

          {isNative && (
            <section>
              <h2 className="mb-1 text-caption text-gray-500">
                {t('settings.notificationsSection')}
              </h2>
              <Card>
                <div className="flex h-12 items-center justify-between">
                  <span className="text-body text-gray-900 dark:text-gray-100">
                    {t('profile.nearbyAlerts')}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={nearby}
                    aria-label={t('profile.nearbyAlerts')}
                    onClick={toggleNearby}
                    className={`inline-flex h-6 w-11 items-center rounded-pill px-0.5 transition-colors ${
                      nearby ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`size-5 rounded-full bg-white shadow transition-transform ${
                        nearby ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </Card>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
