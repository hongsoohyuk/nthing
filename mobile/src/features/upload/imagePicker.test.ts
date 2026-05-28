import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto: vi.fn() },
  CameraResultType: { Uri: 'uri' },
  CameraSource: { Prompt: 'PROMPT' },
}));

import { Camera } from '@capacitor/camera';
import { pickImage } from './imagePicker';

const getPhoto = (Camera as unknown as { getPhoto: ReturnType<typeof vi.fn> }).getPhoto;

describe('pickImage', () => {
  beforeEach(() => {
    getPhoto.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('사진 선택 → blob + contentType 반환', async () => {
    getPhoto.mockResolvedValue({ webPath: 'blob:http://x/abc', format: 'jpeg' });
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      blob: async () => new Blob(['x'], { type: 'image/jpeg' }),
    });
    const result = await pickImage();
    expect(result?.contentType).toBe('image/jpeg');
    expect(result?.blob).toBeInstanceOf(Blob);
  });

  it('취소(plugin throw) → null', async () => {
    getPhoto.mockRejectedValue(new Error('User cancelled photos app'));
    expect(await pickImage()).toBeNull();
  });

  it('webPath 없으면 null', async () => {
    getPhoto.mockResolvedValue({ format: 'jpeg' });
    expect(await pickImage()).toBeNull();
  });
});
