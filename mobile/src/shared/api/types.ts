export type Provider = 'kakao' | 'naver' | 'google' | 'apple';

export type AuthResponse = {
  token: string;
  userId: number;
  nickname: string;
  isNewUser: boolean;
};

export type Me = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  createdAt: string;
};

export type UpdateMeRequest = { nickname: string };

export type AuthUser = {
  id: number;
  nickname: string;
  profileImageUrl?: string | null;
};

// erasableSyntaxOnly: 생성자 파라미터 프로퍼티 금지 → 필드 선언 + 본문 대입
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ── Split 도메인 (서버 SplitDto.kt 기준) ──
export type SplitStatus = 'WAITING' | 'MATCHED' | 'COMPLETED' | 'CANCELLED';

// 서버 SplitCategory.kt 기준 (기본값 OTHER)
export type SplitCategory = 'FOOD' | 'BEVERAGE' | 'HOUSEHOLD' | 'BEAUTY' | 'OTHER';

// 선택 가능한 카테고리 목록 (등록/필터 UI 공용)
export const SPLIT_CATEGORIES: SplitCategory[] = [
  'FOOD',
  'BEVERAGE',
  'HOUSEHOLD',
  'BEAUTY',
  'OTHER',
];

// 카테고리 → i18n 키 (라벨은 4개 로케일 ko/en/ja/zh 공통)
export const CATEGORY_LABEL_KEY: Record<SplitCategory, string> = {
  FOOD: 'category.food',
  BEVERAGE: 'category.beverage',
  HOUSEHOLD: 'category.household',
  BEAUTY: 'category.beauty',
  OTHER: 'category.other',
};

export type Author = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
};

export type Participant = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  joinedAt: string;
};

export type Split = {
  id: number;
  productName: string;
  totalPrice: number;
  totalQty: number;
  splitCount: number;
  pricePerPerson: number;
  qtyPerPerson: number;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  address: string;
  status: SplitStatus;
  category: SplitCategory;
  author: Author;
  createdAt: string;
  participants: Participant[];
  currentParticipants: number;
  distanceKm: number | null;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

export type CreateSplitRequest = {
  productName: string;
  totalPrice: number;
  totalQty: number;
  splitCount: number;
  imageUrl?: string | null;
  latitude: number;
  longitude: number;
  address: string;
  category?: SplitCategory;
};

export type GetSplitsParams = {
  status?: SplitStatus;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  category?: SplitCategory;
  q?: string;
  page?: number;
  size?: number;
};

// ── Upload (서버 UploadDto.kt 기준) ──
export type PresignRequest = {
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  size: number;
};

export type PresignResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresInSeconds: number;
};

// ── Trade lifecycle: no-show report (서버 SplitOutcomeDto.ReportBrokenDto 기준) ──
// reasonTag 는 서버에 그대로 저장되는 관리자용 안정 코드 (로케일 무관).
export type BrokenReasonTag = 'NO_SHOW' | 'UNREACHABLE';

export type ReportBrokenRequest = {
  targetUserId: number;
  reasonTag?: BrokenReasonTag | null;
};

// ── 공개 신뢰 프로필 (서버 TrustProfileDto.kt 기준) ──
export type TrustProfile = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  isNewcomer: boolean;
  successRate: number | null; // 성사율(%), 신규면 null
  promiseCount: number;
  completedCount: number;
  brokenCount: number;
  lateCancelCount: number;
  toneLabel: string; // 서버 한국어 카피 (모바일은 i18n 재계산 사용, 폴백용)
};

// ── Report / Block (서버 ReportDto.kt 기준) ──
export type ReportTargetType = 'SPLIT' | 'USER';

export type ReportReason = 'SPAM' | 'FRAUD' | 'INAPPROPRIATE' | 'HARASSMENT' | 'OTHER';

export type CreateReportRequest = {
  targetType: ReportTargetType;
  targetId: number;
  reason: ReportReason;
  detail?: string | null;
};

export type ReportResponse = { id: number };

export type BlockResponse = { id: number; blockedUserId: number };

export type BlockedUsersResponse = { blockedUserIds: number[] };

// ── Device (서버 DeviceDto.kt 기준) ──
export type DevicePlatform = 'IOS' | 'ANDROID';

export type RegisterDeviceRequest = {
  fcmToken: string;
  platform: DevicePlatform;
  lat?: number;
  lng?: number;
  nearbyAlertsEnabled?: boolean;
};

export type DeviceResponse = { id: number };
