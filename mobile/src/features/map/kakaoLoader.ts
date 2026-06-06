import { env } from '../../shared/lib/env';

export type KakaoLatLng = { getLat: () => number; getLng: () => number };
export type KakaoMapInstance = { setCenter: (latlng: KakaoLatLng) => void };
export type KakaoMarker = {
  setPosition: (latlng: KakaoLatLng) => void;
  setMap: (map: KakaoMapInstance | null) => void;
  getPosition: () => KakaoLatLng;
};
export type KakaoMouseEvent = { latLng: KakaoLatLng };

// services 라이브러리(키워드 장소 검색) 결과 1건
export type KakaoPlace = {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string; // 경도(lng)
  y: string; // 위도(lat)
};
export type KakaoPlacesStatus = 'OK' | 'ZERO_RESULT' | 'ERROR';
export type KakaoPlacesService = {
  keywordSearch: (
    keyword: string,
    callback: (data: KakaoPlace[], status: KakaoPlacesStatus) => void,
  ) => void;
};

export type KakaoMaps = {
  load: (cb: () => void) => void;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number },
  ) => KakaoMapInstance;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Marker: new (options: {
    position: KakaoLatLng;
    map?: KakaoMapInstance;
    draggable?: boolean;
  }) => KakaoMarker;
  event: {
    addListener: (
      target: object,
      type: string,
      handler: (e?: KakaoMouseEvent) => void,
    ) => void;
  };
  services: {
    Places: new () => KakaoPlacesService;
    Status: { OK: 'OK'; ZERO_RESULT: 'ZERO_RESULT'; ERROR: 'ERROR' };
  };
};

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}

const SCRIPT_ID = 'kakao-maps-sdk';

// JS SDK 동적 로드. 키 없으면(또는 로드 실패) null 반환 → 호출부는 placeholder 로 폴백.
export function loadKakaoMaps(key: string = env.kakaoMapKey): Promise<KakaoMaps | null> {
  return new Promise((resolve) => {
    if (!key) {
      resolve(null);
      return;
    }
    // 풀 API(LatLng/Map/Marker)가 준비된 경우만 즉시 반환.
    // autoload=false 라 kakao.maps 는 처음엔 load() 만 있고, load 콜백 후에야
    // LatLng 등 생성자가 붙는다. LatLng 유무로 "완전 로드"를 판별한다.
    if (window.kakao?.maps?.LatLng) {
      resolve(window.kakao.maps);
      return;
    }
    // kakao.maps 는 있지만 아직 load() 전 → load 콜백을 기다린다.
    const waitForLoad = () => {
      if (!window.kakao?.maps) {
        console.warn('[kakao-maps] script loaded but window.kakao.maps missing');
        resolve(null);
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao!.maps));
    };
    const onError = (e: unknown) => {
      console.warn('[kakao-maps] sdk.js load failed', e);
      resolve(null);
    };

    if (window.kakao?.maps) {
      waitForLoad();
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', waitForLoad);
      existing.addEventListener('error', onError);
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    // 명시적 https (protocol-relative `//` 는 일부 네이티브 webview 에서 스킴이 어긋남)
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = waitForLoad;
    script.onerror = onError;
    document.head.appendChild(script);
  });
}
