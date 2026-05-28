import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../shared/stores/authStore';
import { Profile } from './Profile';

function renderProfile() {
  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <Routes>
        <Route path="/profile" element={<Profile />} />
        <Route path="/me/splits" element={<div>MY-SPLITS</div>} />
        <Route path="/me/splits/participated" element={<div>PARTICIPATED</div>} />
        <Route path="/login" element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Profile', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'jwt',
      user: { id: 1, nickname: '엔띵유저' },
      isHydrated: true,
    });
  });

  it('헤더 타이틀과 닉네임, 메뉴 항목을 렌더', () => {
    renderProfile();
    expect(screen.getByText('나의 반띵')).toBeInTheDocument();
    expect(screen.getByText('엔띵유저')).toBeInTheDocument();
    expect(screen.getByText('내 나눠사기')).toBeInTheDocument();
    expect(screen.getByText('참여한 나눠사기')).toBeInTheDocument();
  });

  it('내 나눠사기 클릭 시 /me/splits 로 이동', async () => {
    renderProfile();
    await userEvent.click(screen.getByText('내 나눠사기'));
    expect(await screen.findByText('MY-SPLITS')).toBeInTheDocument();
  });

  it('로그아웃 클릭 시 store.logout 호출 후 /login', async () => {
    const logoutSpy = vi.spyOn(useAuthStore.getState(), 'logout').mockResolvedValue(undefined);
    renderProfile();
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(logoutSpy).toHaveBeenCalledOnce();
    expect(await screen.findByText('LOGIN')).toBeInTheDocument();
  });
});
