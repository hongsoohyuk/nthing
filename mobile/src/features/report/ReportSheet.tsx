import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../../shared/components/BottomSheet';
import { Button } from '../../shared/components/Button';
import { cn } from '../../shared/lib/cn';
import { toast } from '../../shared/stores/toastStore';
import { type ReportReason, type ReportTargetType } from '../../shared/api/types';
import { useCreateReport } from './queries';

const REASONS: ReportReason[] = ['SPAM', 'FRAUD', 'INAPPROPRIATE', 'HARASSMENT', 'OTHER'];

type ReportSheetProps = {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: number;
};

export function ReportSheet({ open, onClose, targetType, targetId }: ReportSheetProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const report = useCreateReport();

  function close() {
    setReason(null);
    onClose();
  }

  function submit() {
    if (!reason) return;
    report.mutate(
      { targetType, targetId, reason },
      {
        onSuccess: () => {
          toast(t('report.done'));
          close();
        },
        onError: () => toast(t('report.error')),
      },
    );
  }

  return (
    <BottomSheet open={open} onClose={close}>
      <h2 className="text-h2 text-gray-900 dark:text-gray-50">{t('report.title')}</h2>
      <p className="mt-1 text-caption text-gray-500">{t('report.subtitle')}</p>

      <div className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label={t('report.title')}>
        {REASONS.map((r) => {
          const selected = reason === r;
          return (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setReason(r)}
              className={cn(
                'rounded-md border px-4 py-3 text-left text-body transition-colors',
                selected
                  ? 'border-brand bg-brand/5 text-gray-900 dark:border-brand-dark-adj dark:text-gray-50'
                  : 'border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-200',
              )}
            >
              {t(`report.reason.${r}`)}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex gap-2">
        <Button variant="secondary" fullWidth onClick={close}>
          {t('report.cancel')}
        </Button>
        <Button fullWidth disabled={!reason} loading={report.isPending} onClick={submit}>
          {t('report.submit')}
        </Button>
      </div>
    </BottomSheet>
  );
}
