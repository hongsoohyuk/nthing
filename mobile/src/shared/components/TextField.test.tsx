import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { TextField } from './TextField';

function Wrapper(props: { initial?: string; error?: string; supportingText?: string }) {
  const [value, setValue] = useState(props.initial ?? '');
  return (
    <TextField
      label="상품명"
      value={value}
      onChange={setValue}
      placeholder="예: 두쫀쿠 4개입"
      error={props.error}
      supportingText={props.supportingText}
    />
  );
}

describe('TextField', () => {
  it('renders label and placeholder', () => {
    render(<Wrapper />);
    expect(screen.getByText('상품명')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('예: 두쫀쿠 4개입')).toBeInTheDocument();
  });

  it('updates value via onChange', async () => {
    render(<Wrapper />);
    const input = screen.getByPlaceholderText('예: 두쫀쿠 4개입');
    await userEvent.type(input, '두쫀쿠');
    expect(input).toHaveValue('두쫀쿠');
  });

  it('shows supporting text when no error', () => {
    render(<Wrapper supportingText="GPS: 37.5024, 127.0344" />);
    expect(screen.getByText('GPS: 37.5024, 127.0344')).toBeInTheDocument();
  });

  it('shows error text and hides supporting when error', () => {
    render(<Wrapper supportingText="optional" error="required" />);
    expect(screen.getByText('required')).toBeInTheDocument();
    expect(screen.queryByText('optional')).not.toBeInTheDocument();
  });

  it('calls onChange with raw string value', async () => {
    const onChange = vi.fn();
    render(<TextField label="t" value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('t'), 'ab');
    expect(onChange).toHaveBeenCalledWith('a');
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
