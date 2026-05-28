import { useNavigate, useParams } from 'react-router-dom';
import { AppBar } from '../shared/components/AppBar';
import { Button } from '../shared/components/Button';
import { StatusBadge } from '../shared/components/Badge';
import { LoadingState } from '../shared/components/states/LoadingState';
import { ErrorState } from '../shared/components/states/ErrorState';
import { useSplit, useJoinSplit, useCancelSplit } from '../features/splits/queries';
import { useAuthStore } from '../shared/stores/authStore';
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
  const userId = useAuthStore((s) => s.user?.id);
  const query = useSplit(splitId);
  const join = useJoinSplit();
  const cancel = useCancelSplit();

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

  return (
    <div className="flex h-screen flex-col">
      <AppBar title="반띵 상세" onBack={() => navigate(-1)} />

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
    </div>
  );
}
