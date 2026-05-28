import { create } from 'zustand';

export type Coords = { lat: number; lng: number };

// GPS 미연동 기본 좌표(서울시청). 실제 위치 캡처(request)는 Phase 1.5 @capacitor/geolocation.
export const DEFAULT_COORDS: Coords = { lat: 37.5665, lng: 126.978 };

type LocationState = {
  current: Coords | null;
  setCurrent: (coords: Coords) => void;
};

export const useLocationStore = create<LocationState>((set) => ({
  current: null,
  setCurrent: (coords) => set({ current: coords }),
}));
