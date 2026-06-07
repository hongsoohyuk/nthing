import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const reportBroken = vi.fn();
vi.mock('./queries', () => ({ useReportBroken: vi.fn() }));

import { useReportBroken } from './queries';
import i18n from '../../shared/i18n';
import { NoShowSheet } from './NoShowSheet';

const useReportBrokenMock = useReportBroken as unknown as ReturnType<typeof vi.fn>;

describe('NoShowSheet', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('ko');
    reportBroken.mockReset();
    useReportBrokenMock.mockReturnValue({ mutate: reportBroken, isPending: false });
  });

  it('상대가 한 명이면 사유 선택 후 reportBroken 호출 (자동 타깃)', async () => {
    render(
      <NoShowSheet
        open
        onClose={() => {}}
        splitId={5}
        counterparts={[{ userId: 99, nickname: '판매자' }]}
      />,
    );
    // 자동 타깃 → 상대 선택 라디오 미노출
    expect(screen.queryByText('누가 약속을 안 지켰나요?')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: '약속 장소에 안 나왔어요' }));
    await userEvent.click(screen.getByRole('button', { name: '신고' }));
    expect(reportBroken).toHaveBeenCalledWith(
      { id: 5, req: { targetUserId: 99, reasonTag: 'NO_SHOW' } },
      expect.anything(),
    );
  });

  it('사유 미선택 시 신고 버튼 비활성', () => {
    render(
      <NoShowSheet
        open
        onClose={() => {}}
        splitId={5}
        counterparts={[{ userId: 99, nickname: '판매자' }]}
      />,
    );
    expect(screen.getByRole('button', { name: '신고' })).toBeDisabled();
  });

  it('상대가 여럿이면 타깃 선택 후 신고', async () => {
    render(
      <NoShowSheet
        open
        onClose={() => {}}
        splitId={5}
        counterparts={[
          { userId: 11, nickname: '참가A' },
          { userId: 22, nickname: '참가B' },
        ]}
      />,
    );
    expect(screen.getByText('누가 약속을 안 지켰나요?')).toBeInTheDocument();
    // 타깃 미선택 → 비활성
    await userEvent.click(screen.getByRole('radio', { name: '연락이 안 돼요' }));
    expect(screen.getByRole('button', { name: '신고' })).toBeDisabled();
    await userEvent.click(screen.getByRole('radio', { name: '참가B' }));
    await userEvent.click(screen.getByRole('button', { name: '신고' }));
    expect(reportBroken).toHaveBeenCalledWith(
      { id: 5, req: { targetUserId: 22, reasonTag: 'UNREACHABLE' } },
      expect.anything(),
    );
  });
});
