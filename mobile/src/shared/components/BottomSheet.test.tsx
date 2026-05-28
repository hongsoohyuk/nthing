import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomSheet } from './BottomSheet';

describe('BottomSheet', () => {
  it('open=false 면 아무것도 렌더하지 않음', () => {
    const { container } = render(
      <BottomSheet open={false} onClose={() => {}}>
        <p>내용</p>
      </BottomSheet>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('open=true 면 children 렌더', () => {
    render(
      <BottomSheet open onClose={() => {}}>
        <p>시트내용</p>
      </BottomSheet>,
    );
    expect(screen.getByText('시트내용')).toBeInTheDocument();
  });

  it('backdrop(닫기) 클릭 시 onClose 호출', async () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose}>
        <p>x</p>
      </BottomSheet>,
    );
    await userEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
