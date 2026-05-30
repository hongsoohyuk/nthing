import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: vi.fn() } }));
vi.mock('@capacitor/preferences', () => ({ Preferences: { get: vi.fn(), set: vi.fn() } }));
vi.mock('./pushService', () => ({ requestPermissionAndRegister: vi.fn() }));

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { requestPermissionAndRegister } from './pushService';
import { usePushPriming } from './usePushPriming';

const isNativePlatform = Capacitor.isNativePlatform as unknown as ReturnType<typeof vi.fn>;
const prefGet = Preferences.get as unknown as ReturnType<typeof vi.fn>;
const prefSet = Preferences.set as unknown as ReturnType<typeof vi.fn>;
const reqRegister = requestPermissionAndRegister as unknown as ReturnType<typeof vi.fn>;

describe('usePushPriming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prefSet.mockResolvedValue(undefined);
  });

  it('네이티브 + 미질문이면 시트 open', async () => {
    isNativePlatform.mockReturnValue(true);
    prefGet.mockResolvedValue({ value: null });
    const { result } = renderHook(() => usePushPriming());
    await waitFor(() => expect(result.current.open).toBe(true));
  });

  it('accept → 플래그 저장 + 권한 요청', async () => {
    isNativePlatform.mockReturnValue(true);
    prefGet.mockResolvedValue({ value: null });
    const { result } = renderHook(() => usePushPriming());
    await waitFor(() => expect(result.current.open).toBe(true));
    await act(async () => {
      await result.current.accept();
    });
    expect(prefSet).toHaveBeenCalledWith({ key: 'nthing.push.asked', value: '1' });
    expect(reqRegister).toHaveBeenCalled();
  });

  it('웹이면 시트 안 뜸', async () => {
    isNativePlatform.mockReturnValue(false);
    const { result } = renderHook(() => usePushPriming());
    await Promise.resolve();
    expect(result.current.open).toBe(false);
  });
});
