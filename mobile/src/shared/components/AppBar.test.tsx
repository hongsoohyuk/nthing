import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppBar } from './AppBar';

describe('AppBar', () => {
  it('renders title', () => {
    render(<AppBar title="근처 반띵" />);
    expect(screen.getByText('근처 반띵')).toBeInTheDocument();
  });

  it('shows back button only when onBack provided', () => {
    const { rerender } = render(<AppBar title="t" />);
    expect(screen.queryByLabelText('뒤로가기')).not.toBeInTheDocument();
    const onBack = vi.fn();
    rerender(<AppBar title="t" onBack={onBack} />);
    expect(screen.getByLabelText('뒤로가기')).toBeInTheDocument();
  });

  it('fires onBack when back button clicked', async () => {
    const onBack = vi.fn();
    render(<AppBar title="t" onBack={onBack} />);
    await userEvent.click(screen.getByLabelText('뒤로가기'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('renders actions slot', () => {
    render(<AppBar title="t" actions={<button>알림</button>} />);
    expect(screen.getByText('알림')).toBeInTheDocument();
  });
});
