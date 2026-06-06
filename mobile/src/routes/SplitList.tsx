import { type UseQueryResult } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppBar } from '../shared/components/AppBar';
import { Button } from '../shared/components/Button';
import { LoadingState } from '../shared/components/states/LoadingState';
import { EmptyState } from '../shared/components/states/EmptyState';
import { ErrorState } from '../shared/components/states/ErrorState';
import { SplitCard } from '../features/splits/SplitCard';
import { useMySplits, useParticipatedSplits } from '../features/splits/queries';
import { type PageResponse, type Split } from '../shared/api/types';

type SplitListProps = { variant: 'my' | 'participated' };

function SplitListView({
  title,
  query,
}: {
  title: string;
  query: UseQueryResult<PageResponse<Split>>;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div>
      <AppBar title={title} onBack={() => navigate(-1)} />
      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message={t('list.loadError')} onRetry={() => void query.refetch()} />
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
        <div className="flex flex-col gap-3 px-4 py-3">
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

function MySplitList() {
  const { t } = useTranslation();
  return <SplitListView title={t('profile.mySplits')} query={useMySplits()} />;
}

function ParticipatedSplitList() {
  const { t } = useTranslation();
  return <SplitListView title={t('profile.participated')} query={useParticipatedSplits()} />;
}

export function SplitList({ variant }: SplitListProps) {
  return variant === 'my' ? <MySplitList /> : <ParticipatedSplitList />;
}
