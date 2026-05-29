import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { loadKakaoMaps } from './kakaoLoader';
import { type Coords } from '../../shared/stores/locationStore';

export type MapMarker = { id: number; lat: number; lng: number };

type KakaoMapProps = {
  center: Coords;
  markers: MapMarker[];
  onMarkerClick: (id: number) => void;
};

export function KakaoMap({ center, markers, onMarkerClick }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const maps = await loadKakaoMaps();
      if (cancelled) return;
      const el = containerRef.current;
      if (!maps || !el) {
        setFailed(true);
        return;
      }
      const map = new maps.Map(el, {
        center: new maps.LatLng(center.lat, center.lng),
        level: 5,
      });
      // 현재 위치 마커
      new maps.Marker({ position: new maps.LatLng(center.lat, center.lng), map });
      // split 핀
      for (const m of markers) {
        const marker = new maps.Marker({ position: new maps.LatLng(m.lat, m.lng), map });
        maps.event.addListener(marker, 'click', () => onMarkerClick(m.id));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [center.lat, center.lng, markers, onMarkerClick]);

  if (failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <MapPin className="size-10 text-gray-300" aria-hidden />
        <p className="text-body text-gray-500 dark:text-gray-400">지도를 불러올 수 없어요</p>
        <p className="text-caption text-gray-400">카카오맵 키 설정 후 다시 시도해 주세요</p>
      </div>
    );
  }
  return <div ref={containerRef} className="size-full" data-testid="kakao-map" />;
}
