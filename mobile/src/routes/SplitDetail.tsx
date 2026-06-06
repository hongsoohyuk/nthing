import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MoreVertical } from 'lucide-react';
import { AppBar } from '../shared/components/AppBar';
import { Button } from '../shared/components/Button';
import { StatusBadge } from '../shared/components/Badge';
import { LoadingState } from '../shared/components/states/LoadingState';
import { ErrorState } from '../shared/components/states/ErrorState';
import { useSplit, useJoinSplit, useCancelSplit } from '../features/splits/queries';
import { ReportSheet } from '../features/report/ReportSheet';
import { useBlockUser } from '../features/report/queries';
import { useAuthStore } from '../shared/stores/authStore';
import { toast } from '../shared/stores/toastStore';
import { formatPrice, formatDistance, formatRelativeTime } from '../shared/lib/format';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-body text-gray-500">{label}</span>
      <span className="text-body text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}

export function SplitDetail() {
  const { id } = useParams();
  const splitId = Number(id);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.user?.id);
  const isLoggedIn = useAuthStore((s) => !!s.token);
  const query = useSplit(splitId);
  const join = useJoinSplit();
  const cancel = useCancelSplit();
  const block = useBlockUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  if (query.isPending) {
    return (
      <div>
        <AppBar title="반띵 상세" onBack={() => navigate(-1)} />
        <LoadingState />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div>
        <AppBar title="반띵 상세" onBack={() => navigate(-1)} />
        <ErrorState message="반띵을 불러오지 못했어요" onRetry={() => void query.refetch()} />
      </div>
    );
  }

  const split = query.data;
  const isMine = split.author.id === userId;
  const isOpen = split.status === 'WAITING';
  const meta = [formatDistance(split.distanceKm), formatRelativeTime(split.createdAt)]
    .filter(Boolean)
    .join(' · ');

  function handleBlock() {
    setMenuOpen(false);
    block.mutate(split.author.id, {
      onSuccess: () => {
        toast(t('block.done', { name: split.author.nickname }));
        navigate(-1);
      },
      onError: () => toast(t('block.error')),
    });
  }

  // 신고/차단은 로그인 + 타인 글일 때만 노출
  const showSafetyMenu = isLoggedIn && !isMine;

  return (
    <div className="flex h-screen flex-col">
      <AppBar
        title="반띵 상세"
        onBack={() => navigate(-1)}
        actions={
          showSafetyMenu ? (
            <div className="relative">
              <button
                type="button"
                aria-label={t('safety.menu')}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
              >
                <MoreVertical className="size-5 text-gray-900 dark:text-gray-50" />
              </button>
              {menuOpen && (
                <>
                  <button
                    type="button"
                    aria-label={t('common.close', { defaultValue: '닫기' })}
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-md border border-gray-200 bg-white shadow-overlay dark:border-gray-700 dark:bg-gray-900"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setReportOpen(true);
                      }}
                      className="block w-full px-4 py-3 text-left text-body text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800"
                    >
                      {t('safety.report')}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleBlock}
                      className="block w-full px-4 py-3 text-left text-body text-error hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      {t('safety.block')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto pb-6">
        <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800">
          {split.imageUrl && (
            <img src={split.imageUrl} alt={split.productName} className="size-full object-cover" />
          )}
        </div>

        <div className="flex flex-col gap-5 px-6 py-5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-display text-gray-900 dark:text-gray-50">{split.productName}</h1>
            <StatusBadge status={split.status} />
          </div>

          <p className="text-caption text-gray-500">
            {split.author.nickname}
            {meta && ` · ${meta}`}
          </p>

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <p className="text-caption text-gray-500">1인당</p>
            <p className="text-display text-brand dark:text-brand-dark-adj">
              {formatPrice(split.pricePerPerson)}
            </p>
            <div className="mt-3 space-y-1">
              <InfoRow label="전체 가격" value={formatPrice(split.totalPrice)} />
              <InfoRow label="전체 수량" value={`${split.totalQty}개`} />
              <InfoRow label="나눌 인원" value={`${split.splitCount}명`} />
            </div>
          </div>

          <div>
            <h2 className="text-h2 text-gray-900 dark:text-gray-50">위치</h2>
            <p className="mt-1 text-body text-gray-700 dark:text-gray-200">{split.address}</p>
            {/* 지도 미리보기는 Phase 1.5 (카카오맵) */}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        {!isOpen ? (
          <Button fullWidth disabled>
            마감된 반띵
          </Button>
        ) : isMine ? (
          <Button
            fullWidth
            variant="secondary"
            loading={cancel.isPending}
            onClick={() => cancel.mutate(splitId)}
          >
            취소하기
          </Button>
        ) : (
          <Button fullWidth loading={join.isPending} onClick={() => join.mutate(splitId)}>
            반띵할게요
          </Button>
        )}
      </div>

      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="SPLIT"
        targetId={split.id}
      />
    </div>
  );
}
