import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '../shared/i18n'; // react-i18next 인스턴스 초기화 (ko) → 상세 위치 라벨 등 실제 문구

const mutate = vi.fn();
vi.mock('../features/splits/queries', () => ({ useCreateSplit: vi.fn() }));
vi.mock('../features/upload/imagePicker', () => ({ pickImage: vi.fn() }));
vi.mock('../features/upload/uploadImage', () => ({ uploadImage: vi.fn() }));

// LocationPicker 는 카카오 SDK 의존 → 검색 결과 1건 고르는 동작을 stub 으로 노출.
// "장소선택" 버튼: 코스트코 양재점(장소명 + 좌표) 선택을 시뮬레이션.
vi.mock('../features/map/LocationPicker', () => ({
  LocationPicker: ({
    onPlaceSelect,
    onCoordsChange,
  }: {
    onPlaceSelect: (p: { placeName: string; coords: { lat: number; lng: number } }) => void;
    onCoordsChange: (c: { lat: number; lng: number }) => void;
  }) => (
    <div>
      <button
        onClick={() =>
          onPlaceSelect({ placeName: '코스트코 양재점', coords: { lat: 37.47, lng: 127.04 } })
        }
      >
        장소선택
      </button>
      <button onClick={() => onCoordsChange({ lat: 37.48, lng: 127.05 })}>핀이동</button>
    </div>
  ),
}));

import { useCreateSplit } from '../features/splits/queries';
import { pickImage } from '../features/upload/imagePicker';
import { uploadImage } from '../features/upload/uploadImage';
import { CreateSplit } from './CreateSplit';

const useCreateSplitMock = useCreateSplit as unknown as ReturnType<typeof vi.fn>;
const pickImageMock = pickImage as unknown as ReturnType<typeof vi.fn>;
const uploadImageMock = uploadImage as unknown as ReturnType<typeof vi.fn>;

function renderCreate() {
  return render(
    <MemoryRouter>
      <CreateSplit />
    </MemoryRouter>,
  );
}

async function fillProductFields() {
  await userEvent.type(screen.getByLabelText('상품명'), '두쫀쿠');
  await userEvent.type(screen.getByLabelText('전체 가격'), '20000');
  await userEvent.type(screen.getByLabelText('전체 수량'), '4');
  await userEvent.type(screen.getByLabelText('나눌 인원'), '2');
}

describe('CreateSplit', () => {
  beforeEach(() => {
    mutate.mockReset();
    pickImageMock.mockReset();
    uploadImageMock.mockReset();
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

  it('상세 위치만 입력해도 제출 가능 (장소 미선택 시 GPS 좌표 폴백)', async () => {
    renderCreate();
    await fillProductFields();
    await userEvent.type(screen.getByLabelText('상세 위치'), '3층 KFC 앞');
    const submit = screen.getByRole('button', { name: '내 반띵 올리기' });
    expect(submit).toBeEnabled();
    await userEvent.click(submit);
    expect(mutate.mock.calls[0][0]).toEqual({
      productName: '두쫀쿠',
      totalPrice: 20000,
      totalQty: 4,
      splitCount: 2,
      category: 'OTHER',
      latitude: 37.5665,
      longitude: 126.978,
      address: '3층 KFC 앞',
    });
  });

  it('장소 선택 + 상세 위치 → "장소명 · 상세" 형식 address, 좌표는 선택 장소', async () => {
    renderCreate();
    await fillProductFields();
    await userEvent.click(screen.getByRole('button', { name: '장소선택' }));
    await userEvent.type(screen.getByLabelText('상세 위치'), '3층 KFC 앞');
    await userEvent.click(screen.getByRole('button', { name: '내 반띵 올리기' }));
    expect(mutate.mock.calls[0][0]).toEqual({
      productName: '두쫀쿠',
      totalPrice: 20000,
      totalQty: 4,
      splitCount: 2,
      category: 'OTHER',
      latitude: 37.47,
      longitude: 127.04,
      address: '코스트코 양재점 · 3층 KFC 앞',
    });
  });

  it('핀 이동 시 좌표가 핀 위치로 갱신', async () => {
    renderCreate();
    await fillProductFields();
    await userEvent.click(screen.getByRole('button', { name: '장소선택' }));
    await userEvent.click(screen.getByRole('button', { name: '핀이동' }));
    await userEvent.click(screen.getByRole('button', { name: '내 반띵 올리기' }));
    expect(mutate.mock.calls[0][0]).toMatchObject({
      latitude: 37.48,
      longitude: 127.05,
      address: '코스트코 양재점',
    });
  });

  it('사진 추가 → 업로드 성공 시 imageUrl 이 payload 에 포함', async () => {
    pickImageMock.mockResolvedValue({
      blob: new Blob(['x'], { type: 'image/jpeg' }),
      contentType: 'image/jpeg',
    });
    uploadImageMock.mockResolvedValue('https://s3/img.jpg');
    renderCreate();

    await userEvent.click(screen.getByRole('button', { name: /사진 추가/ }));
    await waitFor(() => expect(uploadImageMock).toHaveBeenCalled());

    await fillProductFields();
    await userEvent.type(screen.getByLabelText('상세 위치'), '3층 KFC 앞');
    await userEvent.click(screen.getByRole('button', { name: '내 반띵 올리기' }));
    expect(mutate.mock.calls[0][0]).toMatchObject({ imageUrl: 'https://s3/img.jpg' });
  });
});
