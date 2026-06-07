import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../shared/api/nthingApi', () => ({
  nthingApi: { getTrustProfile: vi.fn() },
}));

import { nthingApi } from '../../shared/api/nthingApi';
import { trustKeys, trustTone, useTrustProfile } from './queries';

const api = nthingApi as unknown as Record<string, ReturnType<typeof vi.fn>>;

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('trustTone', () => {
  it('신규 → newcomer', () => {
    expect(trustTone({ isNewcomer: true, successRate: null })).toBe('newcomer');
    expect(trustTone({ isNewcomer: false, successRate: null })).toBe('newcomer');
  });
  it('성사율 구간별 톤', () => {
    expect(trustTone({ isNewcomer: false, successRate: 95 })).toBe('great');
    expect(trustTone({ isNewcomer: false, successRate: 90 })).toBe('great');
    expect(trustTone({ isNewcomer: false, successRate: 80 })).toBe('good');
    expect(trustTone({ isNewcomer: false, successRate: 70 })).toBe('good');
    expect(trustTone({ isNewcomer: false, successRate: 50 })).toBe('poor');
  });
});

describe('useTrustProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('userId 가 있으면 getTrustProfile 호출', async () => {
    api.getTrustProfile.mockResolvedValue({ userId: 9, isNewcomer: true, successRate: null });
    const { result } = renderHook(() => useTrustProfile(9), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.getTrustProfile).toHaveBeenCalledWith(9);
    expect(trustKeys.profile(9)).toEqual(['trust', 9]);
  });

  it('userId 가 undefined 면 호출하지 않음(disabled)', () => {
    renderHook(() => useTrustProfile(undefined), { wrapper: makeWrapper() });
    expect(api.getTrustProfile).not.toHaveBeenCalled();
  });
});
