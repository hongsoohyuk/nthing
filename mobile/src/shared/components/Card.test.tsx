import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>두쫀쿠 4개입</Card>);
    expect(screen.getByText('두쫀쿠 4개입')).toBeInTheDocument();
  });

  it('fires onClick when interactive', async () => {
    const onClick = vi.fn();
    render(
      <Card interactive onClick={onClick}>
        card
      </Card>,
    );
    await userEvent.click(screen.getByText('card'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders as div by default', () => {
    const { container } = render(<Card>x</Card>);
    expect(container.querySelector('div')).toBeInTheDocument();
  });
});
