import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../shared/api/nthingApi', () => ({
  nthingApi: { getTrustProfile: vi.fn() },
}));

import { nthingApi } from '../../shared/api/nthingApi';
import i18n from '../../shared/i18n';
import { TrustBadge } from './TrustBadge';

const api = nthingApi as unknown as Record<string, ReturnType<typeof vi.fn>>;

function renderBadge(userId: number | undefined) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TrustBadge userId={userId} />
    </QueryClientProvider>,
  );
}

describe('TrustBadge', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('ko');
  });

  it('성사율이 높으면 라벨 + 성사율% 표시', async () => {
    api.getTrustProfile.mockResolvedValue({
      userId: 9,
      nickname: 'x',
      profileImageUrl: null,
      isNewcomer: false,
      successRate: 95,
      promiseCount: 20,
      completedCount: 19,
      brokenCount: 1,
      lateCancelCount: 0,
      toneLabel: '',
    });
    renderBadge(9);
    await waitFor(() =>
      expect(screen.getByText('약속을 잘 지켜요 · 성사율 95%')).toBeInTheDocument(),
    );
  });

  it('신규는 newcomer 라벨만 표시', async () => {
    api.getTrustProfile.mockResolvedValue({
      userId: 9,
      nickname: 'x',
      profileImageUrl: null,
      isNewcomer: true,
      successRate: null,
      promiseCount: 0,
      completedCount: 0,
      brokenCount: 0,
      lateCancelCount: 0,
      toneLabel: '',
    });
    renderBadge(9);
    await waitFor(() => expect(screen.getByText('🌱 신규')).toBeInTheDocument());
  });

  it('userId 없으면 아무것도 렌더하지 않음', () => {
    const { container } = renderBadge(undefined);
    expect(container).toBeEmptyDOMElement();
  });
});
