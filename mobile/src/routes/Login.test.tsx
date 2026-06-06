import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../features/auth/oauth', () => ({ startOAuth: vi.fn() }));
vi.mock('../shared/api/nthingApi', () => ({
  nthingApi: {
    devLogin: vi
      .fn()
      .mockResolvedValue({ token: 't', userId: 1, nickname: '개발테스터', isNewUser: false }),
  },
}));

import { startOAuth } from '../features/auth/oauth';
import { Login } from './Login';
import pushData from '../features/auth/mockPushSamples.json';

function renderLogin(showDevLogin = false) {
  return render(
    <MemoryRouter>
      <Login showDevLogin={showDevLogin} />
    </MemoryRouter>,
  );
}

describe('Login', () => {
  beforeEach(() => (startOAuth as ReturnType<typeof vi.fn>).mockReset());

  it('워드마크와 4개 provider 버튼을 렌더', () => {
    renderLogin();
    expect(screen.getByText('Nthing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /카카오/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /네이버/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Google/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apple/ })).toBeInTheDocument();
  });

  it('목업 푸시 캐러셀이 JSON 샘플을 렌더', () => {
    renderLogin();
    const samples = pushData.samples as Array<{ title: string }>;
    expect(samples.length).toBeGreaterThan(0);
    // 데크가 모든 샘플을 DOM에 렌더(순환은 transform/opacity로 처리)
    expect(screen.getByText(samples[0].title)).toBeInTheDocument();
    expect(screen.getByText(samples[samples.length - 1].title)).toBeInTheDocument();
  });

  it('Apple 버튼 클릭 시 startOAuth("apple") 호출', async () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /Apple/ })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: /Apple/ }));
    expect(startOAuth).toHaveBeenCalledWith('apple');
  });

  it('카카오 버튼 클릭 시 startOAuth("kakao") 호출', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /카카오/ }));
    expect(startOAuth).toHaveBeenCalledWith('kakao');
  });

  it('showDevLogin=false 면 dev 버튼 없음, true 면 노출', () => {
    const { unmount } = renderLogin(false);
    expect(screen.queryByRole('button', { name: /테스트 로그인/ })).toBeNull();
    unmount();
    renderLogin(true);
    expect(screen.getByRole('button', { name: /테스트 로그인/ })).toBeInTheDocument();
  });
});
