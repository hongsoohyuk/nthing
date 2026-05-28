import { type UseQueryResult } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  return (
    <div>
      <AppBar title={title} onBack={() => navigate(-1)} />
      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message="목록을 불러오지 못했어요" onRetry={() => void query.refetch()} />
      ) : query.data.content.length === 0 ? (
        <EmptyState
          title="아직 반띵이 없어요"
          subtitle="첫 반띵을 올려보세요"
          action={
            <Button size="md" onClick={() => navigate('/splits/new')}>
              반띵 등록하기
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
  return <SplitListView title="내 나눠사기" query={useMySplits()} />;
}

function ParticipatedSplitList() {
  return <SplitListView title="참여한 나눠사기" query={useParticipatedSplits()} />;
}

export function SplitList({ variant }: SplitListProps) {
  return variant === 'my' ? <MySplitList /> : <ParticipatedSplitList />;
}
