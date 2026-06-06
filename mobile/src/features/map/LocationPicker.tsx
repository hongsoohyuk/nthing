import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Search, Loader2 } from 'lucide-react';
import {
  loadKakaoMaps,
  type KakaoMaps,
  type KakaoMapInstance,
  type KakaoMarker,
  type KakaoPlace,
} from './kakaoLoader';
import { type Coords } from '../../shared/stores/locationStore';

export type PickedLocation = { placeName: string; coords: Coords };

type LocationPickerProps = {
  /** 지도 초기 중심(보통 현재 GPS). 핀도 처음엔 여기에 놓인다. */
  initialCenter: Coords;
  /** 선택된 장소명 (검색 결과에서 고른 값). 상위가 보관. */
  placeName: string;
  /** 검색으로 장소를 고르면 호출 (장소명 + 좌표). */
  onPlaceSelect: (picked: PickedLocation) => void;
  /** 핀을 드래그/탭으로 미세 조정하면 좌표만 갱신. */
  onCoordsChange: (coords: Coords) => void;
  /** SDK/키 사용 불가 판정 시 호출 → 상위에서 폴백 UI 처리 가능. */
  onUnavailable?: () => void;
};

/**
 * 만날 위치 선택기: 카카오 장소 검색(services.Places.keywordSearch) + 조정 가능한 핀.
 * 키/SDK 없으면 graceful degrade (검색·지도 숨기고 안내 문구; 상위의 상세 입력은 유지).
 */
export function LocationPicker({
  initialCenter,
  placeName,
  onPlaceSelect,
  onCoordsChange,
  onUnavailable,
}: LocationPickerProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapsRef = useRef<KakaoMaps | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);
  // 최신 onCoordsChange 를 effect 안의 리스너에서 쓰기 위해 ref 에 보관 (render 중 접근 금지 → effect 에서 갱신)
  const onCoordsChangeRef = useRef(onCoordsChange);
  useEffect(() => {
    onCoordsChangeRef.current = onCoordsChange;
  }, [onCoordsChange]);

  const [failed, setFailed] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<KakaoPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 지도 + 드래그 가능한 핀 초기화 (마운트 시 1회). center 갱신은 setCenter/setPosition 으로.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const maps = await loadKakaoMaps();
      if (cancelled) return;
      const el = containerRef.current;
      if (!maps || !el) {
        setFailed(true);
        onUnavailable?.();
        return;
      }
      mapsRef.current = maps;
      const center = new maps.LatLng(initialCenter.lat, initialCenter.lng);
      const map = new maps.Map(el, { center, level: 4 });
      mapRef.current = map;
      const marker = new maps.Marker({ position: center, map, draggable: true });
      markerRef.current = marker;

      // 핀 드래그 종료 → 좌표 확정
      maps.event.addListener(marker, 'dragend', () => {
        const pos = marker.getPosition();
        onCoordsChangeRef.current({ lat: pos.getLat(), lng: pos.getLng() });
      });
      // 지도 탭 → 핀 이동 + 좌표 확정
      maps.event.addListener(map, 'click', (e) => {
        if (!e) return;
        marker.setPosition(e.latLng);
        onCoordsChangeRef.current({ lat: e.latLng.getLat(), lng: e.latLng.getLng() });
      });
    })();
    return () => {
      cancelled = true;
    };
    // initialCenter 는 의도적으로 1회만 (마운트 후엔 사용자 조작/검색이 핀을 움직임)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const moveTo = (coords: Coords) => {
    const maps = mapsRef.current;
    if (!maps || !mapRef.current || !markerRef.current) return;
    const latlng = new maps.LatLng(coords.lat, coords.lng);
    mapRef.current.setCenter(latlng);
    markerRef.current.setPosition(latlng);
  };

  const runSearch = () => {
    const maps = mapsRef.current;
    const q = keyword.trim();
    if (!maps || q === '') return;
    setSearching(true);
    setSearchError(null);
    const places = new maps.services.Places();
    places.keywordSearch(q, (data, status) => {
      setSearching(false);
      if (status === maps.services.Status.OK) {
        setResults(data);
      } else if (status === maps.services.Status.ZERO_RESULT) {
        setResults([]);
        setSearchError(t('create.locationNoResult'));
      } else {
        setResults([]);
        setSearchError(t('create.locationSearchError'));
      }
    });
  };

  const pickPlace = (place: KakaoPlace) => {
    const coords: Coords = { lat: Number(place.y), lng: Number(place.x) };
    onPlaceSelect({ placeName: place.place_name, coords });
    moveTo(coords);
    setResults([]);
    setKeyword('');
  };

  if (failed) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-meta text-gray-500 dark:text-gray-400">
          {t('create.locationLabel')}
        </span>
        <div className="flex items-center gap-2 rounded-sm border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
          <MapPin className="size-5 shrink-0 text-gray-400" aria-hidden />
          <p className="text-caption text-gray-500 dark:text-gray-400">
            {t('create.locationUnavailable')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-meta text-gray-500 dark:text-gray-400">
        {t('create.locationLabel')}
      </span>

      {/* 장소 검색 박스 */}
      <div className="flex h-[52px] items-center rounded-sm border border-gray-200 bg-white px-4 transition-colors focus-within:border-brand focus-within:ring-1 focus-within:ring-brand dark:border-gray-700 dark:bg-gray-900">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              runSearch();
            }
          }}
          aria-label={t('create.locationSearchLabel')}
          placeholder={t('create.locationSearchPlaceholder')}
          className="flex-1 bg-transparent text-body text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
        />
        <button
          type="button"
          onClick={runSearch}
          aria-label={t('create.locationSearchAction')}
          className="ml-2 flex items-center text-gray-400"
        >
          {searching ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <Search className="size-5" aria-hidden />
          )}
        </button>
      </div>

      {searchError && <p className="text-caption text-gray-500 dark:text-gray-400">{searchError}</p>}

      {/* 검색 결과 리스트 */}
      {results.length > 0 && (
        <ul className="flex flex-col divide-y divide-gray-100 overflow-hidden rounded-sm border border-gray-200 dark:divide-gray-800 dark:border-gray-700">
          {results.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                onClick={() => pickPlace(place)}
                className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <span className="text-body text-gray-900 dark:text-gray-100">
                  {place.place_name}
                </span>
                <span className="text-caption text-gray-500 dark:text-gray-400">
                  {place.road_address_name || place.address_name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 선택된 장소명 */}
      {placeName && (
        <div className="flex items-center gap-1.5 text-caption text-brand dark:text-brand-dark-adj">
          <MapPin className="size-4 shrink-0" aria-hidden />
          <span>{placeName}</span>
        </div>
      )}

      {/* 조정 가능한 핀 지도 */}
      <div
        ref={containerRef}
        data-testid="location-picker-map"
        className="mt-1 h-44 w-full overflow-hidden rounded-sm border border-gray-200 dark:border-gray-700"
      />
      <p className="text-caption text-gray-400">{t('create.locationPinHint')}</p>
    </div>
  );
}
