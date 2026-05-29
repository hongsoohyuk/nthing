import { create } from 'zustand';
import { Geolocation } from '@capacitor/geolocation';

export type Coords = { lat: number; lng: number };

// GPS 미연동 기본 좌표(서울시청). request() 실패/거부 시 폴백으로 사용됨.
export const DEFAULT_COORDS: Coords = { lat: 37.5665, lng: 126.978 };

type LocationState = {
  current: Coords | null;
  setCurrent: (coords: Coords) => void;
  request: () => Promise<boolean>;
};

export const useLocationStore = create<LocationState>((set) => ({
  current: null,
  setCurrent: (coords) => set({ current: coords }),
  request: async () => {
    try {
      let status = await Geolocation.checkPermissions();
      if (status.location !== 'granted') {
        status = await Geolocation.requestPermissions();
      }
      if (status.location !== 'granted') return false;
      const pos = await Geolocation.getCurrentPosition({ timeout: 10000 });
      set({ current: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
      return true;
    } catch {
      return false;
    }
  },
}));
