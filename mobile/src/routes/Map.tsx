import { MapPin } from 'lucide-react';
import { AppBar } from '../shared/components/AppBar';

// Phase 1.5 에서 카카오맵 JS SDK 로 교체. 지금은 placeholder 탭.
export function Map() {
  return (
    <div className="flex h-full flex-col">
      <AppBar title="지도" />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <MapPin className="size-10 text-gray-300" aria-hidden />
        <p className="text-body text-gray-500 dark:text-gray-400">지도는 곧 제공돼요</p>
        <p className="text-caption text-gray-400">근처 반띵을 지도로 보는 기능을 준비 중이에요</p>
      </div>
    </div>
  );
}
