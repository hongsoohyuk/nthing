import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './MainLayout';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/home" element={<div>HOME-TAB</div>} />
          <Route path="/map" element={<div>MAP-TAB</div>} />
          <Route path="/profile" element={<div>PROFILE-TAB</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('MainLayout', () => {
  it('Outlet 자식과 BottomNav 3탭을 렌더', () => {
    renderAt('/home');
    expect(screen.getByText('HOME-TAB')).toBeInTheDocument();
    expect(screen.getByText('홈')).toBeInTheDocument();
    expect(screen.getByText('지도')).toBeInTheDocument();
    expect(screen.getByText('나')).toBeInTheDocument();
  });

  it('현재 탭(home)이 aria-current 로 표시된다', () => {
    renderAt('/home');
    expect(screen.getByRole('button', { name: /홈/ })).toHaveAttribute('aria-current', 'page');
  });

  it('home/map 에는 FAB, profile 에는 FAB 없음', () => {
    const { unmount } = renderAt('/home');
    expect(screen.getByRole('button', { name: '반띵 등록하기' })).toBeInTheDocument();
    unmount();
    renderAt('/profile');
    expect(screen.queryByRole('button', { name: '반띵 등록하기' })).toBeNull();
  });
});
