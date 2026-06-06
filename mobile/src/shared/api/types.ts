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
};

export type GetSplitsParams = {
  status?: SplitStatus;
  lat?: number;
  lng?: number;
  radiusKm?: number;
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
