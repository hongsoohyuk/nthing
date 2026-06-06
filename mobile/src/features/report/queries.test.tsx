import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../shared/api/nthingApi', () => ({
  nthingApi: {
    getBlockedUsers: vi.fn(),
    createReport: vi.fn(),
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
  },
}));

import { nthingApi } from '../../shared/api/nthingApi';
import {
  reportKeys,
  useBlockedUsers,
  useCreateReport,
  useBlockUser,
  useUnblockUser,
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

describe('report/block queries', () => {
  beforeEach(() => vi.clearAllMocks());

  it('useBlockedUsers 는 getBlockedUsers 결과를 반환', async () => {
    api.getBlockedUsers.mockResolvedValue({ blockedUserIds: [7, 9] });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useBlockedUsers(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ blockedUserIds: [7, 9] });
  });

  it('useCreateReport 는 createReport 를 호출', async () => {
    api.createReport.mockResolvedValue({ id: 1 });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreateReport(), { wrapper });
    result.current.mutate({ targetType: 'SPLIT', targetId: 3, reason: 'SPAM' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.createReport).toHaveBeenCalledWith({
      targetType: 'SPLIT',
      targetId: 3,
      reason: 'SPAM',
    });
  });

  it('useBlockUser 성공 시 blocks/splits 쿼리를 무효화', async () => {
    api.blockUser.mockResolvedValue({ id: 1, blockedUserId: 5 });
    const { qc, wrapper } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useBlockUser(), { wrapper });
    result.current.mutate(5);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.blockUser).toHaveBeenCalledWith(5);
    expect(spy).toHaveBeenCalledWith({ queryKey: reportKeys.blocks() });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['splits'] });
  });

  it('useUnblockUser 성공 시 blocks 쿼리를 무효화', async () => {
    api.unblockUser.mockResolvedValue(undefined);
    const { qc, wrapper } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useUnblockUser(), { wrapper });
    result.current.mutate(5);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.unblockUser).toHaveBeenCalledWith(5);
    expect(spy).toHaveBeenCalledWith({ queryKey: reportKeys.blocks() });
  });
});
