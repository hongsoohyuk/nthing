import { describe, it, expect, beforeEach } from 'vitest';
import { useLocationStore, DEFAULT_COORDS } from './locationStore';

describe('locationStore', () => {
  beforeEach(() => useLocationStore.setState({ current: null }));

  it('초기 current 는 null', () => {
    expect(useLocationStore.getState().current).toBeNull();
  });

  it('setCurrent 가 좌표를 보관한다', () => {
    useLocationStore.getState().setCurrent({ lat: 37.1, lng: 127.2 });
    expect(useLocationStore.getState().current).toEqual({ lat: 37.1, lng: 127.2 });
  });

  it('DEFAULT_COORDS 는 서울시청', () => {
    expect(DEFAULT_COORDS).toEqual({ lat: 37.5665, lng: 126.978 });
  });
});
