import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hello } from './Hello';

describe('Hello', () => {
  it('renders Nthing wordmark', () => {
    render(<Hello />);
    expect(screen.getByText('Nthing')).toBeInTheDocument();
    expect(screen.getByText(/Phase 1.1 Foundation OK/)).toBeInTheDocument();
  });
});
