import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@capacitor/browser', () => ({ Browser: { open: vi.fn() } }));

import { Browser } from '@capacitor/browser';
import { buildAuthorizeUrl, startOAuth } from './oauth';

const REDIRECT = encodeURIComponent('http://localhost:8080/api/auth/callback');

describe('buildAuthorizeUrl', () => {
  it('kakao: authorize 엔드포인트 + client_id + redirect_uri + code', () => {
    const url = buildAuthorizeUrl('kakao');
    expect(url).toContain('https://kauth.kakao.com/oauth/authorize');
    expect(url).toContain('response_type=code');
    expect(url).toContain(`redirect_uri=${REDIRECT}%2Fkakao`);
  });

  it('google: openid 스코프 포함', () => {
    const url = buildAuthorizeUrl('google');
    expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url).toContain('scope=');
    expect(url).toContain(`redirect_uri=${REDIRECT}%2Fgoogle`);
  });

  it('naver: state 를 그대로 싣는다', () => {
    const url = buildAuthorizeUrl('naver', 'STATE-XYZ');
    expect(url).toContain('https://nid.naver.com/oauth2.0/authorize');
    expect(url).toContain('state=STATE-XYZ');
  });

  it('apple: form_post + name/email 스코프 + state', () => {
    const url = buildAuthorizeUrl('apple', 'STATE-APL');
    expect(url).toContain('https://appleid.apple.com/auth/authorize');
    expect(url).toContain('response_type=code');
    expect(url).toContain('response_mode=form_post');
    expect(url).toContain('scope=name%20email');
    expect(url).toContain('state=STATE-APL');
    expect(url).toContain(`redirect_uri=${REDIRECT}%2Fapple`);
  });
});

describe('startOAuth', () => {
  beforeEach(() => (Browser.open as ReturnType<typeof vi.fn>).mockReset());

  it('kakao 는 Browser.open 을 authorize URL 로 호출', async () => {
    await startOAuth('kakao');
    const arg = (Browser.open as ReturnType<typeof vi.fn>).mock.calls[0][0] as { url: string };
    expect(arg.url).toContain('kauth.kakao.com');
  });

  it('naver 는 state 를 생성해 sessionStorage 에 저장', async () => {
    await startOAuth('naver');
    expect(sessionStorage.getItem('nthing.naver.state')).toBeTruthy();
  });

  it('apple 도 state 를 생성해 sessionStorage 에 저장', async () => {
    await startOAuth('apple');
    expect(sessionStorage.getItem('nthing.apple.state')).toBeTruthy();
  });
});
