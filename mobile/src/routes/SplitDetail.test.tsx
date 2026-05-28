import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const join = vi.fn();
const cancel = vi.fn();
vi.mock('../features/splits/queries', () => ({
  useSplit: vi.fn(),
  useJoinSplit: vi.fn(),
  useCancelSplit: vi.fn(),
}));

import { useSplit, useJoinSplit, useCancelSplit } from '../features/splits/queries';
import { useAuthStore } from '../shared/stores/authStore';
import { SplitDetail } from './SplitDetail';

const useSplitMock = useSplit as unknown as ReturnType<typeof vi.fn>;
const useJoinMock = useJoinSplit as unknown as ReturnType<typeof vi.fn>;
const useCancelMock = useCancelSplit as unknown as ReturnType<typeof vi.fn>;

const SPLIT = {
  id: 1, productName: '두쫀쿠 4개입', totalPrice: 20000, totalQty: 4, splitCount: 2,
  pricePerPerson: 10000, qtyPerPerson: 2, imageUrl: null,
  latitude: 37.5, longitude: 127, address: '역삼동 GS25', status: 'WAITING',
  author: { id: 99, nickname: '판매자', profileImageUrl: null },
  createdAt: '2026-05-27T10:00:00', participants: [], currentParticipants: 1, distanceKm: 1.2,
};

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/splits/1']}>
      <Routes>
        <Route path="/splits/:id" element={<SplitDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SplitDetail', () => {
  beforeEach(() => {
    join.mockReset();
    cancel.mockReset();
    useJoinMock.mockReturnValue({ mutate: join, isPending: false });
    useCancelMock.mockReturnValue({ mutate: cancel, isPending: false });
    useAuthStore.setState({ token: 'jwt', user: { id: 1, nickname: '나' }, isHydrated: true });
  });

  it('상품 정보와 가격을 렌더', () => {
    useSplitMock.mockReturnValue({ isPending: false, isError: false, data: SPLIT });
    renderDetail();
    expect(screen.getByText('두쫀쿠 4개입')).toBeInTheDocument();
    expect(screen.getByText('₩10,000')).toBeInTheDocument();
    expect(screen.getByText('역삼동 GS25')).toBeInTheDocument();
  });

  it('타인 글 + WAITING → 반띵할게요 클릭 시 join(id)', async () => {
    useSplitMock.mockReturnValue({ isPending: false, isError: false, data: SPLIT });
    renderDetail();
    await userEvent.click(screen.getByRole('button', { name: '반띵할게요' }));
    expect(join).toHaveBeenCalledWith(1);
  });

  it('본인 글 + WAITING → 취소하기 클릭 시 cancel(id)', async () => {
    useAuthStore.setState({ token: 'jwt', user: { id: 99, nickname: '판매자' }, isHydrated: true });
    useSplitMock.mockReturnValue({ isPending: false, isError: false, data: SPLIT });
    renderDetail();
    await userEvent.click(screen.getByRole('button', { name: '취소하기' }));
    expect(cancel).toHaveBeenCalledWith(1);
  });

  it('마감 상태(COMPLETED) → 비활성 마감된 반띵', () => {
    useSplitMock.mockReturnValue({ isPending: false, isError: false, data: { ...SPLIT, status: 'COMPLETED' } });
    renderDetail();
    expect(screen.getByRole('button', { name: '마감된 반띵' })).toBeDisabled();
  });
});
