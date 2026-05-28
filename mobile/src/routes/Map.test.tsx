import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../features/splits/queries', () => ({ useSplits: vi.fn() }));
vi.mock('../features/map/KakaoMap', () => ({
  KakaoMap: ({
    markers,
    onMarkerClick,
  }: {
    markers: Array<{ id: number }>;
    onMarkerClick: (id: number) => void;
  }) => (
    <div>
      {markers.map((m) => (
        <button key={m.id} onClick={() => onMarkerClick(m.id)}>
          pin-{m.id}
        </button>
      ))}
    </div>
  ),
}));

import { useSplits } from '../features/splits/queries';
import { Map } from './Map';

const useSplitsMock = useSplits as unknown as ReturnType<typeof vi.fn>;

const SPLIT = {
  id: 7,
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
  author: { id: 1, nickname: '판매자', profileImageUrl: null },
  createdAt: '2026-05-28T10:00:00',
  participants: [],
  currentParticipants: 1,
  distanceKm: 0.3,
};

function renderMap() {
  return render(
    <MemoryRouter>
      <Map />
    </MemoryRouter>,
  );
}

describe('Map', () => {
  beforeEach(() => useSplitsMock.mockReset());

  it('로딩 중에는 로딩 상태', () => {
    useSplitsMock.mockReturnValue({ isPending: true });
    renderMap();
    expect(screen.getByText('불러오는 중…')).toBeInTheDocument();
  });

  it('핀 클릭 → BottomSheet 에 SplitCard + 반띵할게요', async () => {
    useSplitsMock.mockReturnValue({ isPending: false, isError: false, data: { content: [SPLIT] } });
    renderMap();
    await userEvent.click(screen.getByRole('button', { name: 'pin-7' }));
    expect(screen.getByText('두쫀쿠 4개입')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '반띵할게요' })).toBeInTheDocument();
  });
});
