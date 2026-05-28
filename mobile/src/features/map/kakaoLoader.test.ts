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

  it('window.kakao.maps 가 이미 있으면 그걸 반환(스크립트 추가 안 함)', async () => {
    const maps = { sentinel: true } as unknown;
    (window as unknown as { kakao: { maps: unknown } }).kakao = { maps };
    await expect(loadKakaoMaps('KEY')).resolves.toBe(maps);
    expect(document.getElementById('kakao-maps-sdk')).toBeNull();
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
