import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomNav } from './BottomNav';

describe('BottomNav', () => {
  it('renders 3 tab labels', () => {
    render(<BottomNav current="home" onSelect={vi.fn()} />);
    expect(screen.getByText('홈')).toBeInTheDocument();
    expect(screen.getByText('지도')).toBeInTheDocument();
    expect(screen.getByText('나')).toBeInTheDocument();
  });

  it('marks current tab with aria-current="page"', () => {
    render(<BottomNav current="map" onSelect={vi.fn()} />);
    const mapButton = screen.getByRole('button', { name: /지도/ });
    expect(mapButton).toHaveAttribute('aria-current', 'page');
  });

  it('fires onSelect with tab key', async () => {
    const onSelect = vi.fn();
    render(<BottomNav current="home" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /지도/ }));
    expect(onSelect).toHaveBeenCalledWith('map');
  });
});
