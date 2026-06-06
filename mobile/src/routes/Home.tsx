import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppBar } from '../shared/components/AppBar';
import { Chip } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { LoadingState } from '../shared/components/states/LoadingState';
import { EmptyState } from '../shared/components/states/EmptyState';
import { ErrorState } from '../shared/components/states/ErrorState';
import { SplitCard } from '../features/splits/SplitCard';
import { useSplits } from '../features/splits/queries';
import { useLocationStore, DEFAULT_COORDS } from '../shared/stores/locationStore';
import { type SplitStatus } from '../shared/api/types';

// 서버 카테고리/마감 필드 부재로 1.4 는 전체/모집중만 배선 (음식/생필품/마감임박은 후속)
const FILTERS: Array<{ labelKey: string; status?: SplitStatus }> = [
  { labelKey: 'home.filterAll', status: undefined },
  { labelKey: 'home.filterRecruiting', status: 'WAITING' },
];

export function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const coords = useLocationStore((s) => s.current) ?? DEFAULT_COORDS;
  const [filterIdx, setFilterIdx] = useState(0);
  const query = useSplits({
    lat: coords.lat,
    lng: coords.lng,
    radiusKm: 3,
    status: FILTERS[filterIdx].status,
  });

  return (
    <div>
      <AppBar title={t('home.title')} />
      <div className="flex gap-2 overflow-x-auto px-4 pb-3">
        {FILTERS.map((f, i) => (
          <Chip key={f.labelKey} active={i === filterIdx} onClick={() => setFilterIdx(i)}>
            {t(f.labelKey)}
          </Chip>
        ))}
      </div>

      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message={t('splits.loadError')} onRetry={() => void query.refetch()} />
      ) : query.data.content.length === 0 ? (
        <EmptyState
          title={t('splits.emptyTitle')}
          subtitle={t('splits.emptySubtitle')}
          action={
            <Button size="md" onClick={() => navigate('/splits/new')}>
              {t('common.registerSplit')}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3 px-4 pb-24">
          {query.data.content.map((split) => (
            <SplitCard
              key={split.id}
              split={split}
              onClick={() => navigate(`/splits/${split.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
