import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Map } from './Map';

describe('Map', () => {
  it('지도 탭 placeholder 안내를 렌더', () => {
    render(<Map />);
    expect(screen.getByText('지도')).toBeInTheDocument();
    expect(screen.getByText('지도는 곧 제공돼요')).toBeInTheDocument();
  });
});
