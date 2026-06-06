import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const join = vi.fn();
const cancel = vi.fn();
const block = vi.fn();
const report = vi.fn();
vi.mock('../features/splits/queries', () => ({
  useSplit: vi.fn(),
  useJoinSplit: vi.fn(),
  useCancelSplit: vi.fn(),
}));
vi.mock('../features/report/queries', () => ({
  useBlockUser: vi.fn(),
  useCreateReport: vi.fn(),
}));

import { useSplit, useJoinSplit, useCancelSplit } from '../features/splits/queries';
import { useBlockUser, useCreateReport } from '../features/report/queries';
import { useAuthStore } from '../shared/stores/authStore';
import i18n from '../shared/i18n';
import { SplitDetail } from './SplitDetail';

const useSplitMock = useSplit as unknown as ReturnType<typeof vi.fn>;
const useJoinMock = useJoinSplit as unknown as ReturnType<typeof vi.fn>;
const useCancelMock = useCancelSplit as unknown as ReturnType<typeof vi.fn>;
const useBlockMock = useBlockUser as unknown as ReturnType<typeof vi.fn>;
const useReportMock = useCreateReport as unknown as ReturnType<typeof vi.fn>;

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
  address: '역삼동 GS25',
  status: 'WAITING',
  author: { id: 99, nickname: '판매자', profileImageUrl: null },
  createdAt: '2026-05-27T10:00:00',
  participants: [],
  currentParticipants: 1,
  distanceKm: 1.2,
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
  beforeEach(async () => {
    await i18n.changeLanguage('ko');
    join.mockReset();
    cancel.mockReset();
    block.mockReset();
    report.mockReset();
    useJoinMock.mockReturnValue({ mutate: join, isPending: false });
    useCancelMock.mockReturnValue({ mutate: cancel, isPending: false });
    useBlockMock.mockReturnValue({ mutate: block, isPending: false });
    useReportMock.mockReturnValue({ mutate: report, isPending: false });
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
    useSplitMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...SPLIT, status: 'COMPLETED' },
    });
    renderDetail();
    expect(screen.getByRole('button', { name: '마감된 반띵' })).toBeDisabled();
  });

  it('타인 글 → 더보기 메뉴에 신고/차단 노출, 차단 클릭 시 block(authorId)', async () => {
    useSplitMock.mockReturnValue({ isPending: false, isError: false, data: SPLIT });
    renderDetail();
    await userEvent.click(screen.getByRole('button', { name: '더보기' }));
    expect(screen.getByRole('menuitem', { name: '신고하기' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('menuitem', { name: '차단하기' }));
    expect(block).toHaveBeenCalledWith(99, expect.anything());
  });

  it('타인 글 → 신고하기 클릭 시 신고 시트가 열린다', async () => {
    useSplitMock.mockReturnValue({ isPending: false, isError: false, data: SPLIT });
    renderDetail();
    await userEvent.click(screen.getByRole('button', { name: '더보기' }));
    await userEvent.click(screen.getByRole('menuitem', { name: '신고하기' }));
    expect(screen.getByRole('radio', { name: '사기 의심' })).toBeInTheDocument();
  });

  it('본인 글 → 더보기(신고/차단) 메뉴 없음', () => {
    useAuthStore.setState({ token: 'jwt', user: { id: 99, nickname: '판매자' }, isHydrated: true });
    useSplitMock.mockReturnValue({ isPending: false, isError: false, data: SPLIT });
    renderDetail();
    expect(screen.queryByRole('button', { name: '더보기' })).not.toBeInTheDocument();
  });
});
