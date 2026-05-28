import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('./kakaoLoader', () => ({ loadKakaoMaps: vi.fn() }));

import { loadKakaoMaps } from './kakaoLoader';
import { KakaoMap } from './KakaoMap';

const loadMock = loadKakaoMaps as unknown as ReturnType<typeof vi.fn>;

describe('KakaoMap', () => {
  beforeEach(() => loadMock.mockReset());

  it('로더가 null 이면 placeholder 렌더', async () => {
    loadMock.mockResolvedValue(null);
    render(<KakaoMap center={{ lat: 37.5, lng: 127 }} markers={[]} onMarkerClick={vi.fn()} />);
    expect(await screen.findByText('지도를 불러올 수 없어요')).toBeInTheDocument();
  });

  it('로더 성공 시 Map/Marker 생성 + 핀 클릭 → onMarkerClick(id)', async () => {
    const listeners: Array<() => void> = [];
    const fakeMaps = {
      load: (cb: () => void) => cb(),
      LatLng: vi.fn(function (this: unknown, lat: number, lng: number) {
        return { lat, lng };
      }),
      Map: vi.fn(function (this: unknown) {
        return { setCenter: vi.fn() };
      }),
      Marker: vi.fn(function (this: unknown) {
        return {};
      }),
      event: {
        addListener: vi.fn((_t: object, _type: string, h: () => void) => {
          listeners.push(h);
        }),
      },
    };
    loadMock.mockResolvedValue(fakeMaps);
    const onMarkerClick = vi.fn();

    render(
      <KakaoMap
        center={{ lat: 37.5, lng: 127 }}
        markers={[{ id: 7, lat: 37.5, lng: 127 }]}
        onMarkerClick={onMarkerClick}
      />,
    );

    await waitFor(() => expect(fakeMaps.Map).toHaveBeenCalled());
    expect(fakeMaps.Marker).toHaveBeenCalledTimes(2); // 현재위치 1 + split 1
    expect(listeners).toHaveLength(1);
    listeners[0]();
    expect(onMarkerClick).toHaveBeenCalledWith(7);
  });
});
