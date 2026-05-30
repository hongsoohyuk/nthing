import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./http', () => ({ apiFetch: vi.fn() }));

import { apiFetch } from './http';
import { nthingApi } from './nthingApi';

const mockFetch = apiFetch as unknown as ReturnType<typeof vi.fn>;

describe('device api', () => {
  beforeEach(() => mockFetch.mockReset());

  it('registerDevice → POST /devices with body', async () => {
    mockFetch.mockResolvedValue({ id: 1 });
    await nthingApi.registerDevice({ fcmToken: 'tok', platform: 'ANDROID', lat: 37.5, lng: 127 });
    expect(mockFetch).toHaveBeenCalledWith('/devices', {
      method: 'POST',
      body: { fcmToken: 'tok', platform: 'ANDROID', lat: 37.5, lng: 127 },
    });
  });

  it('unregisterDevice → POST /devices/unregister', async () => {
    mockFetch.mockResolvedValue(undefined);
    await nthingApi.unregisterDevice('tok');
    expect(mockFetch).toHaveBeenCalledWith('/devices/unregister', {
      method: 'POST',
      body: { fcmToken: 'tok' },
    });
  });
});
