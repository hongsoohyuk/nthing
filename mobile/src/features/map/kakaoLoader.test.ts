import { describe, it, expect, beforeEach } from 'vitest';
import { loadKakaoMaps } from './kakaoLoader';

describe('loadKakaoMaps', () => {
  beforeEach(() => {
    document.getElementById('kakao-maps-sdk')?.remove();
    delete (window as { kakao?: unknown }).kakao;
  });

  it('키가 없으면 스크립트 없이 null 반환', async () => {
    await expect(loadKakaoMaps('')).resolves.toBeNull();
    expect(document.getElementById('kakao-maps-sdk')).toBeNull();
  });

  it('풀 API(LatLng)가 이미 준비됐으면 그걸 반환(스크립트 추가 안 함)', async () => {
    // autoload=false 라 LatLng 유무로 "완전 로드"를 판별한다.
    const maps = { sentinel: true, LatLng: function () {} } as unknown;
    (window as unknown as { kakao: { maps: unknown } }).kakao = { maps };
    await expect(loadKakaoMaps('KEY')).resolves.toBe(maps);
    expect(document.getElementById('kakao-maps-sdk')).toBeNull();
  });

  it('kakao.maps 는 있지만 LatLng 미준비면 load() 콜백을 기다린다', async () => {
    let loadCb: (() => void) | null = null;
    const maps = { load: (cb: () => void) => (loadCb = cb) } as unknown;
    (window as unknown as { kakao: { maps: unknown } }).kakao = { maps };
    const promise = loadKakaoMaps('KEY');
    // load 콜백 전에는 미해결 → 스크립트도 추가 안 함
    expect(document.getElementById('kakao-maps-sdk')).toBeNull();
    loadCb!(); // 라이브러리 로드 완료 시뮬레이션
    await expect(promise).resolves.toBe(maps);
  });

  it('키가 있으면 SDK 스크립트 주입 + onload→load 콜백 후 maps 반환', async () => {
    const promise = loadKakaoMaps('KEY123');
    const script = document.getElementById('kakao-maps-sdk') as HTMLScriptElement;
    expect(script).toBeTruthy();
    expect(script.src).toContain('dapi.kakao.com');
    expect(script.src).toContain('appkey=KEY123');
    expect(script.src).toContain('autoload=false');

    (window as unknown as { kakao: { maps: { load: (cb: () => void) => void } } }).kakao = {
      maps: { load: (cb: () => void) => cb() },
    };
    script.onload?.(new Event('load'));

    await expect(promise).resolves.toBeTruthy();
  });

  it('스크립트 로드 실패(onerror) → null', async () => {
    const promise = loadKakaoMaps('KEY123');
    const script = document.getElementById('kakao-maps-sdk') as HTMLScriptElement;
    script.onerror?.(new Event('error'));
    await expect(promise).resolves.toBeNull();
  });
});
