import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

describe('LoadingState', () => {
  it('renders default message', () => {
    render(<LoadingState />);
    expect(screen.getByText('불러오는 중…')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<LoadingState message="반띵 모으는 중…" />);
    expect(screen.getByText('반띵 모으는 중…')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders title and subtitle', () => {
    render(<EmptyState title="아직 반띵이 없어요" subtitle="첫 반띵을 올려보세요" />);
    expect(screen.getByText('아직 반띵이 없어요')).toBeInTheDocument();
    expect(screen.getByText('첫 반띵을 올려보세요')).toBeInTheDocument();
  });

  it('renders action slot', () => {
    render(<EmptyState title="t" action={<button>등록</button>} />);
    expect(screen.getByText('등록')).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('renders message', () => {
    render(<ErrorState message="네트워크 오류" />);
    expect(screen.getByText('네트워크 오류')).toBeInTheDocument();
  });

  it('shows retry button when onRetry provided', async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="x" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('hides retry button when onRetry omitted', () => {
    render(<ErrorState message="x" />);
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument();
  });
});
