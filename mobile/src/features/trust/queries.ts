import { useQuery } from '@tanstack/react-query';
import { nthingApi } from '../../shared/api/nthingApi';
import { type TrustProfile } from '../../shared/api/types';

export const trustKeys = {
  profile: (userId: number) => ['trust', userId] as const,
};

// 공개 신뢰 프로필. 비인증 허용 → 둘러보기 중에도 상대 신뢰도 노출.
export function useTrustProfile(userId: number | undefined) {
  return useQuery<TrustProfile>({
    queryKey: trustKeys.profile(userId ?? 0),
    queryFn: () => nthingApi.getTrustProfile(userId as number),
    enabled: typeof userId === 'number' && Number.isFinite(userId),
    staleTime: 5 * 60 * 1000, // 신뢰도는 자주 안 바뀜 → 5분 캐시
  });
}

// 신뢰 프로필 → UI 톤 (i18n 키 + Badge tone). 서버 toneLabel 대신 모바일에서 재계산해 4개 로케일 지원.
export type TrustTone = 'newcomer' | 'great' | 'good' | 'poor';

export function trustTone(profile: Pick<TrustProfile, 'isNewcomer' | 'successRate'>): TrustTone {
  if (profile.isNewcomer || profile.successRate == null) return 'newcomer';
  if (profile.successRate >= 90) return 'great';
  if (profile.successRate >= 70) return 'good';
  return 'poor';
}
