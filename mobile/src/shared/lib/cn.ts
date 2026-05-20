import clsx, { type ClassValue } from 'clsx';

/**
 * className 합성 헬퍼.
 * 사용 예:
 *   cn('h-13 rounded-md', variant === 'primary' && 'bg-brand text-white')
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
