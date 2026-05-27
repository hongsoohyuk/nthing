import { describe, it, expect } from 'vitest';
import { parseAuthCallback } from './deepLink';

describe('parseAuthCallback', () => {
  it('정상 콜백에서 provider/code/state 추출', () => {
    const r = parseAuthCallback('nthing://auth/callback?provider=naver&code=ABC&state=XYZ');
    expect(r).toEqual({ provider: 'naver', code: 'ABC', state: 'XYZ', error: undefined });
  });

  it('error 콜백 추출', () => {
    const r = parseAuthCallback('nthing://auth/callback?provider=kakao&error=access_denied');
    expect(r).toMatchObject({ provider: 'kakao', error: 'access_denied' });
    expect(r?.code).toBeUndefined();
  });

  it('우리 콜백이 아닌 URL 은 null', () => {
    expect(parseAuthCallback('nthing://other?x=1')).toBeNull();
    expect(parseAuthCallback('https://example.com/auth/callback?provider=kakao&code=A')).toBeNull();
  });

  it('provider 없으면 null', () => {
    expect(parseAuthCallback('nthing://auth/callback?code=A')).toBeNull();
  });
});
