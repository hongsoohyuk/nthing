import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Fab } from './Fab';

describe('Fab', () => {
  it('renders with aria-label', () => {
    render(<Fab label="등록" onClick={vi.fn()} />);
    expect(screen.getByLabelText('등록')).toBeInTheDocument();
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    render(<Fab label="x" onClick={onClick} />);
    await userEvent.click(screen.getByLabelText('x'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
