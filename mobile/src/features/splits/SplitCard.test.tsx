import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SplitCard } from './SplitCard';
import { type Split } from '../../shared/api/types';

const SPLIT: Split = {
  id: 1,
  productName: '두쫀쿠 4개입',
  totalPrice: 20000,
  totalQty: 4,
  splitCount: 2,
  pricePerPerson: 10000,
  qtyPerPerson: 2,
  imageUrl: null,
  latitude: 37.5665,
  longitude: 126.978,
  address: '서울 강남구 역삼동',
  status: 'WAITING',
  author: { id: 99, nickname: '판매자', profileImageUrl: null },
  createdAt: '2026-05-27T10:00:00',
  participants: [],
  currentParticipants: 1,
  distanceKm: 0.3,
};

describe('SplitCard', () => {
  it('상품명/1인당 가격/모집 인원/상태 배지를 렌더', () => {
    render(<SplitCard split={SPLIT} />);
    expect(screen.getByText('두쫀쿠 4개입')).toBeInTheDocument();
    expect(screen.getByText('1인당 ₩10,000')).toBeInTheDocument();
    expect(screen.getByText('2명 모집')).toBeInTheDocument();
    expect(screen.getByText('모집중')).toBeInTheDocument();
  });

  it('onClick 이 있으면 클릭 시 호출', async () => {
    const onClick = vi.fn();
    render(<SplitCard split={SPLIT} onClick={onClick} />);
    await userEvent.click(screen.getByText('두쫀쿠 4개입'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
