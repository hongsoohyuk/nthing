import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../features/splits/queries', () => ({ useSplits: vi.fn() }));

import { useSplits } from '../features/splits/queries';
import { Home } from './Home';

const useSplitsMock = useSplits as unknown as ReturnType<typeof vi.fn>;

const SPLIT = {
  id: 1, productName: '두쫀쿠 4개입', totalPrice: 20000, totalQty: 4, splitCount: 2,
  pricePerPerson: 10000, qtyPerPerson: 2, imageUrl: null,
  latitude: 37.5, longitude: 127, address: '역삼동', status: 'WAITING',
  author: { id: 99, nickname: '판매자', profileImageUrl: null },
  createdAt: '2026-05-27T10:00:00', participants: [], currentParticipants: 1, distanceKm: 0.3,
};

function renderHome() {
  return render(<MemoryRouter><Home /></MemoryRouter>);
}

describe('Home', () => {
  beforeEach(() => useSplitsMock.mockReset());

  it('타이틀과 필터 칩을 렌더', () => {
    useSplitsMock.mockReturnValue({ isPending: true });
    renderHome();
    expect(screen.getByText('근처 반띵')).toBeInTheDocument();
    expect(screen.getByText('전체')).toBeInTheDocument();
    expect(screen.getByText('모집중')).toBeInTheDocument();
  });

  it('로딩 중에는 로딩 상태', () => {
    useSplitsMock.mockReturnValue({ isPending: true });
    renderHome();
    expect(screen.getByText('불러오는 중…')).toBeInTheDocument();
  });

  it('빈 목록이면 Empty 카피', () => {
    useSplitsMock.mockReturnValue({ isPending: false, isError: false, data: { content: [] } });
    renderHome();
    expect(screen.getByText('아직 반띵이 없어요')).toBeInTheDocument();
  });

  it('데이터가 있으면 SplitCard 렌더', () => {
    useSplitsMock.mockReturnValue({ isPending: false, isError: false, data: { content: [SPLIT] } });
    renderHome();
    expect(screen.getByText('두쫀쿠 4개입')).toBeInTheDocument();
    expect(screen.getByText('1인당 ₩10,000')).toBeInTheDocument();
  });
});
