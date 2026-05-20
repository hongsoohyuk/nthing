import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>반띵할게요</Button>);
    expect(screen.getByRole('button', { name: '반띵할게요' })).toBeInTheDocument();
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>tap</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when loading', async () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>loading</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is disabled when disabled prop true', () => {
    render(<Button disabled>x</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies fullWidth class', () => {
    render(<Button fullWidth>x</Button>);
    expect(screen.getByRole('button').className).toContain('w-full');
  });

  it('renders spinner when loading', () => {
    render(<Button loading aria-label="loading-button">x</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});
