import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: vi.fn() } }));
vi.mock('@capacitor-firebase/messaging', () => ({ FirebaseMessaging: { addListener: vi.fn() } }));
vi.mock('./pushService', () => ({ syncDeviceLocation: vi.fn() }));

import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { PushListener } from './PushListener';

const isNativePlatform = Capacitor.isNativePlatform as unknown as ReturnType<typeof vi.fn>;
const addListener = FirebaseMessaging.addListener as unknown as ReturnType<typeof vi.fn>;

describe('PushListener', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addListener.mockResolvedValue({ remove: vi.fn() });
  });

  it('알림 탭 → /splits/:id 이동', () => {
    isNativePlatform.mockReturnValue(true);
    const handlers: Record<string, (e: unknown) => void> = {};
    addListener.mockImplementation((event: string, cb: (e: unknown) => void) => {
      handlers[event] = cb;
      return Promise.resolve({ remove: vi.fn() });
    });

    render(<PushListener />);
    handlers['notificationActionPerformed']?.({ notification: { data: { splitId: '42' } } });
    expect(navigate).toHaveBeenCalledWith('/splits/42');
  });

  it('웹이면 리스너 등록 안 함', () => {
    isNativePlatform.mockReturnValue(false);
    render(<PushListener />);
    expect(addListener).not.toHaveBeenCalled();
  });
});
