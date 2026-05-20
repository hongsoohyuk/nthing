import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge, StatusBadge, Chip } from './Badge';

describe('Badge', () => {
  it('renders with text', () => {
    render(<Badge>NEW</Badge>);
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('uses brand tone classes', () => {
    render(<Badge tone="brand">x</Badge>);
    const el = screen.getByText('x');
    expect(el.className).toContain('text-brand');
  });
});

describe('StatusBadge', () => {
  it('shows 모집중 for WAITING', () => {
    render(<StatusBadge status="WAITING" />);
    expect(screen.getByText('모집중')).toBeInTheDocument();
  });

  it('shows 매칭됨 for MATCHED', () => {
    render(<StatusBadge status="MATCHED" />);
    expect(screen.getByText('매칭됨')).toBeInTheDocument();
  });

  it('shows 마감임박 for URGENT with warning tone', () => {
    render(<StatusBadge status="URGENT" />);
    const el = screen.getByText('마감임박');
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('text-warning');
  });
});

describe('Chip', () => {
  it('renders text and fires onClick', async () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>전체</Chip>);
    await userEvent.click(screen.getByText('전체'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows active state classes when active', () => {
    render(<Chip active>전체</Chip>);
    expect(screen.getByText('전체').className).toContain('bg-brand');
  });
});
