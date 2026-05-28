import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../features/splits/queries', () => ({
  useMySplits: vi.fn(),
  useParticipatedSplits: vi.fn(),
}));

import { useMySplits, useParticipatedSplits } from '../features/splits/queries';
import { SplitList } from './SplitList';

const useMyMock = useMySplits as unknown as ReturnType<typeof vi.fn>;
const useParticipatedMock = useParticipatedSplits as unknown as ReturnType<typeof vi.fn>;

const SPLIT = {
  id: 1,
  productName: '두쫀쿠 4개입',
  totalPrice: 20000,
  totalQty: 4,
  splitCount: 2,
  pricePerPerson: 10000,
  qtyPerPerson: 2,
  imageUrl: null,
  latitude: 37.5,
  longitude: 127,
  address: '역삼동',
  status: 'WAITING',
  author: { id: 99, nickname: '판매자', profileImageUrl: null },
  createdAt: '2026-05-27T10:00:00',
  participants: [],
  currentParticipants: 1,
  distanceKm: null,
};

function renderList(variant: 'my' | 'participated') {
  return render(
    <MemoryRouter>
      <SplitList variant={variant} />
    </MemoryRouter>,
  );
}

describe('SplitList', () => {
  beforeEach(() => {
    useMyMock.mockReset();
    useParticipatedMock.mockReset();
    useMyMock.mockReturnValue({ isPending: true });
    useParticipatedMock.mockReturnValue({ isPending: true });
  });

  it('my variant 타이틀 + 데이터 렌더', () => {
    useMyMock.mockReturnValue({ isPending: false, isError: false, data: { content: [SPLIT] } });
    renderList('my');
    expect(screen.getByText('내 나눠사기')).toBeInTheDocument();
    expect(screen.getByText('두쫀쿠 4개입')).toBeInTheDocument();
  });

  it('participated variant 타이틀', () => {
    useParticipatedMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: { content: [] },
    });
    renderList('participated');
    expect(screen.getByText('참여한 나눠사기')).toBeInTheDocument();
    expect(screen.getByText('아직 반띵이 없어요')).toBeInTheDocument();
  });
});
