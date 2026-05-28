// 가격: ₩10,000 (ICU 비의존 — 수동 천단위 콤마)
export function formatPrice(value: number): string {
  return `₩${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

// 거리: 1km 미만 → m(반올림), 이상 → 소수1자리 km. null/undefined → ''
export function formatDistance(km: number | null | undefined): string {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

// 상대 시간: 방금 전 / N분 전 / N시간 전 / N일 전 / YYYY.MM.DD (7일 이상)
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const min = Math.floor((now.getTime() - then.getTime()) / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  const y = then.getFullYear();
  const m = String(then.getMonth() + 1).padStart(2, '0');
  const d = String(then.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}
