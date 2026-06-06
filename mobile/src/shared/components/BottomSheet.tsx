import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative rounded-t-xl bg-white p-4 shadow-overlay dark:bg-gray-900">
        {children}
      </div>
    </div>
  );
}
