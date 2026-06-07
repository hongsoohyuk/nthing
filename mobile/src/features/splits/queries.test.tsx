import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../shared/api/nthingApi', () => ({
  nthingApi: {
    getSplits: vi.fn(),
    getSplit: vi.fn(),
    getMySplits: vi.fn(),
    getParticipatedSplits: vi.fn(),
    createSplit: vi.fn(),
    joinSplit: vi.fn(),
    cancelSplit: vi.fn(),
    completeSplit: vi.fn(),
    reportBroken: vi.fn(),
    leaveSplit: vi.fn(),
  },
}));

import { nthingApi } from '../../shared/api/nthingApi';
import {
  splitKeys,
  useSplits,
  useSplit,
  useCreateSplit,
  useJoinSplit,
  useCompleteSplit,
  useReportBroken,
  useLeaveSplit,
} from './queries';

const api = nthingApi as unknown as Record<string, ReturnType<typeof vi.fn>>;

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    qc,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

const PAGE = {
  content: [{ id: 1 }],
  page: 0,
  size: 20,
  totalElements: 1,
  totalPages: 1,
  hasNext: false,
};

describe('splitKeys', () => {
  it('스펙 컨벤션 키', () => {
    expect(splitKeys.all).toEqual(['splits']);
    expect(splitKeys.list({ lat: 1, lng: 2 })).toEqual(['splits', { lat: 1, lng: 2 }]);
    expect(splitKeys.detail(5)).toEqual(['splits', 5]);
    expect(splitKeys.my()).toEqual(['splits', 'my']);
    expect(splitKeys.participated()).toEqual(['splits', 'participated']);
  });
});

describe('useSplits / useSplit', () => {
  beforeEach(() => vi.clearAllMocks());

  it('useSplits 는 getSplits 결과를 반환', async () => {
    api.getSplits.mockResolvedValue(PAGE);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSplits({ lat: 1, lng: 2 }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.getSplits).toHaveBeenCalledWith({ lat: 1, lng: 2 });
    expect(result.current.data).toEqual(PAGE);
  });

  it('useSplit 는 getSplit(id) 결과를 반환', async () => {
    api.getSplit.mockResolvedValue({ id: 9 });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSplit(9), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.getSplit).toHaveBeenCalledWith(9);
  });
});

describe('mutations invalidate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('useCreateSplit 성공 시 splits 쿼리를 무효화', async () => {
    api.createSplit.mockResolvedValue({ id: 1 });
    const { qc, wrapper } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreateSplit(), { wrapper });
    result.current.mutate({
      productName: 'x',
      totalPrice: 100,
      totalQty: 2,
      splitCount: 2,
      latitude: 1,
      longitude: 2,
      address: 'a',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: splitKeys.all });
  });

  it('useJoinSplit 성공 시 상세 캐시를 갱신', async () => {
    api.joinSplit.mockResolvedValue({ id: 4, status: 'MATCHED' });
    const { qc, wrapper } = makeWrapper();
    const setSpy = vi.spyOn(qc, 'setQueryData');
    const { result } = renderHook(() => useJoinSplit(), { wrapper });
    result.current.mutate(4);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(setSpy).toHaveBeenCalledWith(splitKeys.detail(4), { id: 4, status: 'MATCHED' });
  });

  it('useCompleteSplit 성공 시 상세 캐시 갱신', async () => {
    api.completeSplit.mockResolvedValue({ id: 4, status: 'COMPLETED' });
    const { qc, wrapper } = makeWrapper();
    const setSpy = vi.spyOn(qc, 'setQueryData');
    const { result } = renderHook(() => useCompleteSplit(), { wrapper });
    result.current.mutate(4);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.completeSplit).toHaveBeenCalledWith(4);
    expect(setSpy).toHaveBeenCalledWith(splitKeys.detail(4), { id: 4, status: 'COMPLETED' });
  });

  it('useReportBroken 은 {id, req} 로 reportBroken 호출', async () => {
    api.reportBroken.mockResolvedValue({ id: 4, status: 'MATCHED' });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useReportBroken(), { wrapper });
    result.current.mutate({ id: 4, req: { targetUserId: 9, reasonTag: 'NO_SHOW' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.reportBroken).toHaveBeenCalledWith(4, { targetUserId: 9, reasonTag: 'NO_SHOW' });
  });

  it('useLeaveSplit 성공 시 상세 캐시 갱신', async () => {
    api.leaveSplit.mockResolvedValue({ id: 4, status: 'WAITING' });
    const { qc, wrapper } = makeWrapper();
    const setSpy = vi.spyOn(qc, 'setQueryData');
    const { result } = renderHook(() => useLeaveSplit(), { wrapper });
    result.current.mutate(4);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.leaveSplit).toHaveBeenCalledWith(4);
    expect(setSpy).toHaveBeenCalledWith(splitKeys.detail(4), { id: 4, status: 'WAITING' });
  });
});
