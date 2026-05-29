import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLocationStore } from '../../shared/stores/locationStore';
import { useEnsureLocation } from './useEnsureLocation';

describe('useEnsureLocation', () => {
  beforeEach(() => {
    useLocationStore.setState({ current: null });
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('current 가 없으면 마운트 시 request() 를 1회 호출', () => {
    const spy = vi.spyOn(useLocationStore.getState(), 'request').mockResolvedValue(true);
    renderHook(() => useEnsureLocation());
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('current 가 이미 있으면 request() 를 호출하지 않음', () => {
    useLocationStore.setState({ current: { lat: 1, lng: 2 } });
    const spy = vi.spyOn(useLocationStore.getState(), 'request').mockResolvedValue(true);
    renderHook(() => useEnsureLocation());
    expect(spy).not.toHaveBeenCalled();
  });
});
