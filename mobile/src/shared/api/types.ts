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
