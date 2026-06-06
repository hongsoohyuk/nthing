import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '../../shared/i18n'; // react-i18next 인스턴스 초기화 (ko) → t() 가 실제 문구 반환

vi.mock('./kakaoLoader', () => ({ loadKakaoMaps: vi.fn() }));

import { loadKakaoMaps } from './kakaoLoader';
import { LocationPicker } from './LocationPicker';

const loadMock = loadKakaoMaps as unknown as ReturnType<typeof vi.fn>;
const CENTER = { lat: 37.5, lng: 127 };

// 좌표 객체 getLat/getLng 헬퍼를 가진 가짜 LatLng + 이벤트 리스너 수집 가짜 maps SDK
function makeFakeMaps(keywordResult: { data: unknown[]; status: string }) {
  const listeners: Record<string, (e?: unknown) => void> = {};
  const latlng = (lat: number, lng: number) => ({ getLat: () => lat, getLng: () => lng });
  const marker = {
    setPosition: vi.fn(),
    setMap: vi.fn(),
    getPosition: () => latlng(37.9, 127.9),
  };
  const fakeMaps = {
    load: (cb: () => void) => cb(),
    LatLng: vi.fn(function (this: unknown, lat: number, lng: number) {
      return latlng(lat, lng);
    }),
    Map: vi.fn(function (this: unknown) {
      return { setCenter: vi.fn() };
    }),
    Marker: vi.fn(function (this: unknown) {
      return marker;
    }),
    event: {
      addListener: vi.fn((_t: object, type: string, h: (e?: unknown) => void) => {
        listeners[type] = h;
      }),
    },
    services: {
      Status: { OK: 'OK', ZERO_RESULT: 'ZERO_RESULT', ERROR: 'ERROR' },
      Places: vi.fn(function (this: unknown) {
        return {
          keywordSearch: (_q: string, cb: (d: unknown[], s: string) => void) =>
            cb(keywordResult.data, keywordResult.status),
        };
      }),
    },
  };
  return { fakeMaps, listeners, marker };
}

describe('LocationPicker', () => {
  beforeEach(() => loadMock.mockReset());

  it('SDK 사용 불가 시 안내 문구로 graceful degrade', async () => {
    loadMock.mockResolvedValue(null);
    const onUnavailable = vi.fn();
    render(
      <LocationPicker
        initialCenter={CENTER}
        placeName=""
        onPlaceSelect={vi.fn()}
        onCoordsChange={vi.fn()}
        onUnavailable={onUnavailable}
      />,
    );
    expect(
      await screen.findByText('지도를 불러올 수 없어요. 아래 상세 위치를 입력해 주세요'),
    ).toBeInTheDocument();
    expect(onUnavailable).toHaveBeenCalled();
  });

  it('키워드 검색 → 결과 클릭 시 onPlaceSelect(장소명 + 좌표)', async () => {
    const { fakeMaps } = makeFakeMaps({
      status: 'OK',
      data: [
        {
          id: '1',
          place_name: '코스트코 양재점',
          address_name: '서울 서초구',
          road_address_name: '서울 서초구 양재대로',
          x: '127.04',
          y: '37.47',
        },
      ],
    });
    loadMock.mockResolvedValue(fakeMaps);
    const onPlaceSelect = vi.fn();
    render(
      <LocationPicker
        initialCenter={CENTER}
        placeName=""
        onPlaceSelect={onPlaceSelect}
        onCoordsChange={vi.fn()}
      />,
    );
    await waitFor(() => expect(fakeMaps.Map).toHaveBeenCalled());

    await userEvent.type(screen.getByLabelText('장소 검색'), '코스트코');
    await userEvent.keyboard('{Enter}');
    const result = await screen.findByRole('button', { name: /코스트코 양재점/ });
    await userEvent.click(result);

    expect(onPlaceSelect).toHaveBeenCalledWith({
      placeName: '코스트코 양재점',
      coords: { lat: 37.47, lng: 127.04 },
    });
  });

  it('결과 없음 시 안내 문구', async () => {
    const { fakeMaps } = makeFakeMaps({ status: 'ZERO_RESULT', data: [] });
    loadMock.mockResolvedValue(fakeMaps);
    render(
      <LocationPicker
        initialCenter={CENTER}
        placeName=""
        onPlaceSelect={vi.fn()}
        onCoordsChange={vi.fn()}
      />,
    );
    await waitFor(() => expect(fakeMaps.Map).toHaveBeenCalled());
    await userEvent.type(screen.getByLabelText('장소 검색'), 'zzz');
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByText('검색 결과가 없어요')).toBeInTheDocument();
  });

  it('핀 드래그 종료 시 onCoordsChange(핀 좌표)', async () => {
    const { fakeMaps, listeners } = makeFakeMaps({ status: 'ZERO_RESULT', data: [] });
    loadMock.mockResolvedValue(fakeMaps);
    const onCoordsChange = vi.fn();
    render(
      <LocationPicker
        initialCenter={CENTER}
        placeName=""
        onPlaceSelect={vi.fn()}
        onCoordsChange={onCoordsChange}
      />,
    );
    await waitFor(() => expect(listeners.dragend).toBeTypeOf('function'));
    listeners.dragend();
    expect(onCoordsChange).toHaveBeenCalledWith({ lat: 37.9, lng: 127.9 });
  });

  it('지도 탭 시 핀 이동 + onCoordsChange(탭 좌표)', async () => {
    const { fakeMaps, listeners, marker } = makeFakeMaps({ status: 'ZERO_RESULT', data: [] });
    loadMock.mockResolvedValue(fakeMaps);
    const onCoordsChange = vi.fn();
    render(
      <LocationPicker
        initialCenter={CENTER}
        placeName=""
        onPlaceSelect={vi.fn()}
        onCoordsChange={onCoordsChange}
      />,
    );
    await waitFor(() => expect(listeners.click).toBeTypeOf('function'));
    const tapLatLng = { getLat: () => 37.1, getLng: () => 127.1 };
    listeners.click({ latLng: tapLatLng });
    expect(marker.setPosition).toHaveBeenCalledWith(tapLatLng);
    expect(onCoordsChange).toHaveBeenCalledWith({ lat: 37.1, lng: 127.1 });
  });
});
