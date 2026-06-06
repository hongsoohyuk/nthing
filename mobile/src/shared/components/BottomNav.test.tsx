import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomNav } from './BottomNav';

describe('BottomNav', () => {
  it('renders home + profile tabs only (no map)', () => {
    render(<BottomNav current="home" onSelect={vi.fn()} />);
    expect(screen.getByText('홈')).toBeInTheDocument();
    expect(screen.getByText('나')).toBeInTheDocument();
    expect(screen.queryByText('지도')).toBeNull();
  });

  it('marks current tab with aria-current="page"', () => {
    render(<BottomNav current="profile" onSelect={vi.fn()} />);
    const profileButton = screen.getByRole('button', { name: /나/ });
    expect(profileButton).toHaveAttribute('aria-current', 'page');
  });

  it('fires onSelect with tab key', async () => {
    const onSelect = vi.fn();
    render(<BottomNav current="home" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /나/ }));
    expect(onSelect).toHaveBeenCalledWith('profile');
  });
});
