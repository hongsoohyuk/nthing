import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mutate = vi.fn();
vi.mock('../features/splits/queries', () => ({ useCreateSplit: vi.fn() }));

import { useCreateSplit } from '../features/splits/queries';
import { CreateSplit } from './CreateSplit';

const useCreateSplitMock = useCreateSplit as unknown as ReturnType<typeof vi.fn>;

function renderCreate() {
  return render(
    <MemoryRouter>
      <CreateSplit />
    </MemoryRouter>,
  );
}

describe('CreateSplit', () => {
  beforeEach(() => {
    mutate.mockReset();
    useCreateSplitMock.mockReturnValue({ mutate, isPending: false });
  });

  it('필수 입력 전 제출 버튼은 비활성', () => {
    renderCreate();
    expect(screen.getByRole('button', { name: '내 반띵 올리기' })).toBeDisabled();
  });

  it('가격/인원 입력 시 1인당 미리보기를 계산', async () => {
    renderCreate();
    await userEvent.type(screen.getByLabelText('전체 가격'), '20000');
    await userEvent.type(screen.getByLabelText('나눌 인원'), '2');
    expect(screen.getByText('₩10,000')).toBeInTheDocument();
  });

  it('유효 입력 후 제출 시 createSplit 페이로드로 mutate', async () => {
    renderCreate();
    await userEvent.type(screen.getByLabelText('상품명'), '두쫀쿠');
    await userEvent.type(screen.getByLabelText('전체 가격'), '20000');
    await userEvent.type(screen.getByLabelText('전체 수량'), '4');
    await userEvent.type(screen.getByLabelText('나눌 인원'), '2');
    await userEvent.type(screen.getByLabelText('주소'), '역삼동 GS25');

    const submit = screen.getByRole('button', { name: '내 반띵 올리기' });
    expect(submit).toBeEnabled();
    await userEvent.click(submit);

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toEqual({
      productName: '두쫀쿠',
      totalPrice: 20000,
      totalQty: 4,
      splitCount: 2,
      latitude: 37.5665,
      longitude: 126.978,
      address: '역삼동 GS25',
    });
  });
});
