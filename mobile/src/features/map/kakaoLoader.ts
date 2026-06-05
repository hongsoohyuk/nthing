import { env } from '../../shared/lib/env';

export type KakaoLatLng = object;
export type KakaoMapInstance = { setCenter: (latlng: KakaoLatLng) => void };
export type KakaoMarker = object;
export type KakaoMaps = {
  load: (cb: () => void) => void;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number },
  ) => KakaoMapInstance;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Marker: new (options: { position: KakaoLatLng; map?: KakaoMapInstance }) => KakaoMarker;
  event: { addListener: (target: object, type: string, handler: () => void) => void };
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
    if (window.kakao?.maps) {
      resolve(window.kakao.maps);
      return;
    }
    const onReady = () => {
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

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', onReady);
      existing.addEventListener('error', onError);
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    // 명시적 https (protocol-relative `//` 는 일부 네이티브 webview 에서 스킴이 어긋남)
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = onReady;
    script.onerror = onError;
    document.head.appendChild(script);
  });
}
