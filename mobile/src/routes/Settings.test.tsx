// mobile/src/routes/Settings.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../shared/i18n';
import { Settings } from './Settings';
import { useThemeStore } from '../shared/stores/themeStore';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false, getPlatform: () => 'web' },
}));
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn().mockResolvedValue({ value: null }),
    set: vi.fn().mockResolvedValue(undefined),
  },
}));

function renderSettings() {
  return render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>,
  );
}

describe('Settings', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('ko');
    document.documentElement.classList.remove('dark');
    useThemeStore.setState({ mode: 'system' });
  });

  it('언어/테마 섹션을 렌더', () => {
    renderSettings();
    expect(screen.getByText('언어')).toBeInTheDocument();
    expect(screen.getByText('테마')).toBeInTheDocument();
    expect(screen.getByText('한국어')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('English 선택 시 화면 텍스트가 영어로 바뀐다', async () => {
    renderSettings();
    await userEvent.click(screen.getByText('English'));
    expect(await screen.findByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  it('다크 선택 시 html.dark 토글', async () => {
    renderSettings();
    await userEvent.click(screen.getByText('다크'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(useThemeStore.getState().mode).toBe('dark');
  });
});
