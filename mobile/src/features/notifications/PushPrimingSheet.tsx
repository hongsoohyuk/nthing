import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../../shared/components/BottomSheet';
import { Button } from '../../shared/components/Button';

type Props = { open: boolean; onAccept: () => void; onDismiss: () => void };

export function PushPrimingSheet({ open, onAccept, onDismiss }: Props) {
  const { t } = useTranslation();
  return (
    <BottomSheet open={open} onClose={onDismiss}>
      <h2 className="text-h2 text-gray-900 dark:text-gray-50">{t('push.primingTitle')}</h2>
      <p className="mt-2 text-body text-gray-600 dark:text-gray-300">
        {t('push.primingBody')}
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <Button onClick={onAccept}>{t('push.primingAccept')}</Button>
        <Button variant="text" onClick={onDismiss}>
          {t('push.primingLater')}
        </Button>
      </div>
    </BottomSheet>
  );
}
