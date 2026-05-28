import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../shared/api/nthingApi', () => ({ nthingApi: { signUpload: vi.fn() } }));

import { nthingApi } from '../../shared/api/nthingApi';
import { uploadImage } from './uploadImage';

const signUpload = (nthingApi as unknown as { signUpload: ReturnType<typeof vi.fn> }).signUpload;

describe('uploadImage', () => {
  beforeEach(() => {
    signUpload.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('signUpload → S3 PUT → publicUrl 반환', async () => {
    signUpload.mockResolvedValue({
      uploadUrl: 'https://s3/put?sig',
      publicUrl: 'https://s3/img.jpg',
      key: 'k',
      expiresInSeconds: 300,
    });
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, status: 200 });

    const blob = new Blob(['x'], { type: 'image/jpeg' });
    const url = await uploadImage({ blob, contentType: 'image/jpeg' });

    expect(signUpload).toHaveBeenCalledWith({ contentType: 'image/jpeg', size: blob.size });
    const [putUrl, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(putUrl).toBe('https://s3/put?sig');
    expect((init as RequestInit).method).toBe('PUT');
    expect((init as RequestInit).body).toBe(blob);
    expect((init as RequestInit).headers).toMatchObject({ 'Content-Type': 'image/jpeg' });
    expect(url).toBe('https://s3/img.jpg');
  });

  it('PUT 실패(비2xx) → throw', async () => {
    signUpload.mockResolvedValue({
      uploadUrl: 'https://s3/put',
      publicUrl: 'https://s3/img.jpg',
      key: 'k',
      expiresInSeconds: 300,
    });
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 403 });
    await expect(
      uploadImage({ blob: new Blob(['x'], { type: 'image/jpeg' }), contentType: 'image/jpeg' }),
    ).rejects.toThrow();
  });
});
