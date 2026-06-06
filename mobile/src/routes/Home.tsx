import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { AppBar } from '../shared/components/AppBar';
import { Chip } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { LoadingState } from '../shared/components/states/LoadingState';
import { EmptyState } from '../shared/components/states/EmptyState';
import { ErrorState } from '../shared/components/states/ErrorState';
import { SplitCard } from '../features/splits/SplitCard';
import { useSplits } from '../features/splits/queries';
import { useLocationStore, DEFAULT_COORDS } from '../shared/stores/locationStore';
import {
  SPLIT_CATEGORIES,
  CATEGORY_LABEL_KEY,
  type SplitCategory,
} from '../shared/api/types';

export function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const coords = useLocationStore((s) => s.current) ?? DEFAULT_COORDS;
  // category=undefined → 전체, q 빈 문자열 → 필터 없음
  const [category, setCategory] = useState<SplitCategory | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const q = searchInput.trim();

  const query = useSplits({
    lat: coords.lat,
    lng: coords.lng,
    radiusKm: 3,
    category,
    q: q || undefined,
  });

  return (
    <div>
      <AppBar title="근처 반띵" />

      <div className="px-4 pb-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('home.searchPlaceholder')}
            aria-label={t('home.searchPlaceholder')}
            className="w-full rounded-pill border border-gray-200 bg-transparent py-2 pl-9 pr-4 text-body text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none dark:border-gray-700 dark:text-gray-50"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-3">
        <Chip active={category === undefined} onClick={() => setCategory(undefined)}>
          {t('category.all')}
        </Chip>
        {SPLIT_CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {t(CATEGORY_LABEL_KEY[c])}
          </Chip>
        ))}
      </div>

      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message="반띵을 불러오지 못했어요" onRetry={() => void query.refetch()} />
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
