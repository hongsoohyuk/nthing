import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppBar } from '../shared/components/AppBar';
import { Button } from '../shared/components/Button';
import { LoadingState } from '../shared/components/states/LoadingState';
import { ErrorState } from '../shared/components/states/ErrorState';
import { BottomSheet } from '../shared/components/BottomSheet';
import { SplitCard } from '../features/splits/SplitCard';
import { KakaoMap, type MapMarker } from '../features/map/KakaoMap';
import { useSplits } from '../features/splits/queries';
import { useLocationStore, DEFAULT_COORDS } from '../shared/stores/locationStore';

export function Map() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const coords = useLocationStore((s) => s.current) ?? DEFAULT_COORDS;
  const query = useSplits({ lat: coords.lat, lng: coords.lng, radiusKm: 3 });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const markers: MapMarker[] = useMemo(
    () => (query.data?.content ?? []).map((s) => ({ id: s.id, lat: s.latitude, lng: s.longitude })),
    [query.data],
  );
  const selected = (query.data?.content ?? []).find((s) => s.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <AppBar title={t('map.title')} />
      <div className="relative flex-1">
        {query.isPending ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState message={t('splits.loadError')} onRetry={() => void query.refetch()} />
        ) : (
          <KakaoMap center={coords} markers={markers} onMarkerClick={setSelectedId} />
        )}
      </div>

      <BottomSheet open={selected !== null} onClose={() => setSelectedId(null)}>
        {selected && (
          <div className="flex flex-col gap-3">
            <SplitCard split={selected} />
            <Button fullWidth onClick={() => navigate(`/splits/${selected.id}`)}>
              {t('common.join')}
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
