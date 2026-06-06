import { describe, it, expect, beforeAll } from 'vitest';
import i18n from '../i18n';
import { formatPrice, formatDistance, formatRelativeTime } from './format';

beforeAll(async () => {
  await i18n.changeLanguage('ko');
});

describe('formatPrice', () => {
  it('천 단위 콤마 + 원화 기호', () => {
    expect(formatPrice(10000)).toBe('₩10,000');
    expect(formatPrice(0)).toBe('₩0');
    expect(formatPrice(1234567)).toBe('₩1,234,567');
  });
});

describe('formatDistance', () => {
  it('1km 미만은 m, 이상은 소수1자리 km', () => {
    expect(formatDistance(0.3)).toBe('300m');
    expect(formatDistance(1.25)).toBe('1.3km');
    expect(formatDistance(12)).toBe('12.0km');
  });
  it('null/undefined 면 빈 문자열', () => {
    expect(formatDistance(null)).toBe('');
    expect(formatDistance(undefined)).toBe('');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-05-27T12:00:00');
  it('구간별 상대 시간', () => {
    expect(formatRelativeTime('2026-05-27T11:59:40', now)).toBe('방금 전');
    expect(formatRelativeTime('2026-05-27T11:30:00', now)).toBe('30분 전');
    expect(formatRelativeTime('2026-05-27T09:00:00', now)).toBe('3시간 전');
    expect(formatRelativeTime('2026-05-25T12:00:00', now)).toBe('2일 전');
  });
  it('7일 이상이면 YYYY.MM.DD', () => {
    expect(formatRelativeTime('2026-05-01T12:00:00', now)).toBe('2026.05.01');
  });
});
