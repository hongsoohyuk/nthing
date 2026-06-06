import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nthingApi } from '../../shared/api/nthingApi';
import {
  type BlockedUsersResponse,
  type CreateReportRequest,
} from '../../shared/api/types';

export const reportKeys = {
  blocks: () => ['blocks'] as const,
};

export function useBlockedUsers() {
  return useQuery<BlockedUsersResponse>({
    queryKey: reportKeys.blocks(),
    queryFn: () => nthingApi.getBlockedUsers(),
  });
}

export function useCreateReport() {
  return useMutation({
    mutationFn: (req: CreateReportRequest) => nthingApi.createReport(req),
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => nthingApi.blockUser(userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reportKeys.blocks() });
      // 차단 후 피드/상세에서 해당 유저가 사라지도록 splits 도 무효화 (서버 피드 필터는 후속)
      void qc.invalidateQueries({ queryKey: ['splits'] });
    },
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => nthingApi.unblockUser(userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reportKeys.blocks() });
    },
  });
}
