import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nthingApi } from '../../shared/api/nthingApi';
import {
  type CreateSplitRequest,
  type GetSplitsParams,
  type PageResponse,
  type Split,
} from '../../shared/api/types';

// 스펙 쿼리 키 컨벤션: ['splits', {params}] / ['splits', id] / ['splits','my'|'participated']
export const splitKeys = {
  all: ['splits'] as const,
  list: (params: GetSplitsParams) => ['splits', params] as const,
  detail: (id: number) => ['splits', id] as const,
  my: () => ['splits', 'my'] as const,
  participated: () => ['splits', 'participated'] as const,
};

export function useSplits(params: GetSplitsParams) {
  return useQuery<PageResponse<Split>>({
    queryKey: splitKeys.list(params),
    queryFn: () => nthingApi.getSplits(params),
  });
}

export function useSplit(id: number) {
  return useQuery<Split>({
    queryKey: splitKeys.detail(id),
    queryFn: () => nthingApi.getSplit(id),
    enabled: Number.isFinite(id),
  });
}

export function useMySplits(page = 0) {
  return useQuery<PageResponse<Split>>({
    queryKey: splitKeys.my(),
    queryFn: () => nthingApi.getMySplits(page),
  });
}

export function useParticipatedSplits(page = 0) {
  return useQuery<PageResponse<Split>>({
    queryKey: splitKeys.participated(),
    queryFn: () => nthingApi.getParticipatedSplits(page),
  });
}

export function useCreateSplit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateSplitRequest) => nthingApi.createSplit(req),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: splitKeys.all });
    },
  });
}

export function useJoinSplit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => nthingApi.joinSplit(id),
    onSuccess: (updated) => {
      qc.setQueryData(splitKeys.detail(updated.id), updated);
      void qc.invalidateQueries({ queryKey: splitKeys.all });
    },
  });
}

export function useCancelSplit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => nthingApi.cancelSplit(id),
    onSuccess: (updated) => {
      qc.setQueryData(splitKeys.detail(updated.id), updated);
      void qc.invalidateQueries({ queryKey: splitKeys.all });
    },
  });
}
