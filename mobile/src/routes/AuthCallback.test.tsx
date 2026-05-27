import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../shared/api/nthingApi', () => ({
  nthingApi: {
    loginKakao: vi.fn().mockResolvedValue({ token: 't', userId: 1, nickname: 'k', isNewUser: false }),
    loginNaver: vi.fn().mockResolvedValue({ token: 't', userId: 1, nickname: 'n', isNewUser: false }),
    loginGoogle: vi.fn(),
  },
}));

import { nthingApi } from '../shared/api/nthingApi';
import { useAuthStore } from '../shared/stores/authStore';
import { AuthCallback } from './AuthCallback';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/home" element={<div>HOME</div>} />
        <Route path="/login" element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AuthCallback', () => {
  beforeEach(() => {
    vi.spyOn(useAuthStore.getState(), 'setAuth').mockResolvedValue(undefined);
    sessionStorage.clear();
  });

  it('kakao code 로 진입 → loginKakao 호출 후 /home', async () => {
    renderAt('/auth/callback?provider=kakao&code=ABC');
    await waitFor(() => expect(nthingApi.loginKakao).toHaveBeenCalledWith('ABC'));
    expect(await screen.findByText('HOME')).toBeInTheDocument();
  });

  it('naver: state 가 sessionStorage 와 일치할 때만 loginNaver', async () => {
    sessionStorage.setItem('nthing.naver.state', 'S1');
    renderAt('/auth/callback?provider=naver&code=ABC&state=S1');
    await waitFor(() => expect(nthingApi.loginNaver).toHaveBeenCalledWith('ABC', 'S1'));
  });

  it('error 파라미터면 /login 으로', async () => {
    renderAt('/auth/callback?provider=kakao&error=access_denied');
    expect(await screen.findByText('LOGIN')).toBeInTheDocument();
  });
});
