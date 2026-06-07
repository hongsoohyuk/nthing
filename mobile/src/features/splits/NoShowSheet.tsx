import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../../shared/components/BottomSheet';
import { Button } from '../../shared/components/Button';
import { cn } from '../../shared/lib/cn';
import { toast } from '../../shared/stores/toastStore';
import { type BrokenReasonTag } from '../../shared/api/types';
import { useReportBroken } from './queries';

const REASONS: BrokenReasonTag[] = ['NO_SHOW', 'UNREACHABLE'];

export type NoShowCounterpart = { userId: number; nickname: string };

type NoShowSheetProps = {
  open: boolean;
  onClose: () => void;
  splitId: number;
  counterparts: NoShowCounterpart[];
};

// 노쇼/불이행 신고 시트. 상대가 한 명이면 자동 선택, 여럿이면 고른다.
export function NoShowSheet({ open, onClose, splitId, counterparts }: NoShowSheetProps) {
  const { t } = useTranslation();
  const single = counterparts.length === 1 ? counterparts[0].userId : null;
  const [targetId, setTargetId] = useState<number | null>(single);
  const [reason, setReason] = useState<BrokenReasonTag | null>(null);
  const report = useReportBroken();

  function close() {
    setTargetId(single);
    setReason(null);
    onClose();
  }

  function submit() {
    if (targetId == null || !reason) return;
    report.mutate(
      { id: splitId, req: { targetUserId: targetId, reasonTag: reason } },
      {
        onSuccess: () => {
          toast(t('noShow.done'));
          close();
        },
        onError: () => toast(t('noShow.error')),
      },
    );
  }

  return (
    <BottomSheet open={open} onClose={close}>
      <h2 className="text-h2 text-gray-900 dark:text-gray-50">{t('noShow.title')}</h2>
      <p className="mt-1 text-caption text-gray-500">{t('noShow.subtitle')}</p>

      {counterparts.length > 1 && (
        <div className="mt-4">
          <p className="text-caption text-gray-500">{t('noShow.pickTarget')}</p>
          <div
            className="mt-2 flex flex-col gap-2"
            role="radiogroup"
            aria-label={t('noShow.pickTarget')}
          >
            {counterparts.map((c) => {
              const selected = targetId === c.userId;
              return (
                <button
                  key={c.userId}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTargetId(c.userId)}
                  className={cn(
                    'rounded-md border px-4 py-3 text-left text-body transition-colors',
                    selected
                      ? 'border-brand bg-brand/5 text-gray-900 dark:border-brand-dark-adj dark:text-gray-50'
                      : 'border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-200',
                  )}
                >
                  {c.nickname}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label={t('noShow.title')}>
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
              {t(`noShow.reason.${r}`)}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex gap-2">
        <Button variant="secondary" fullWidth onClick={close}>
          {t('noShow.cancel')}
        </Button>
        <Button
          fullWidth
          disabled={targetId == null || !reason}
          loading={report.isPending}
          onClick={submit}
        >
          {t('noShow.submit')}
        </Button>
      </div>
    </BottomSheet>
  );
}
