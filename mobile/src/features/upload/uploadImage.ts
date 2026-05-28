import { nthingApi } from '../../shared/api/nthingApi';
import { type PickedImage } from './imagePicker';

// presigned URL 발급 → S3 PUT → publicUrl 반환. 실패 시 throw.
export async function uploadImage(image: PickedImage): Promise<string> {
  const { uploadUrl, publicUrl } = await nthingApi.signUpload({
    contentType: image.contentType,
    size: image.blob.size,
  });
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': image.contentType },
    body: image.blob,
  });
  if (!res.ok) throw new Error(`업로드 실패 (${res.status})`);
  return publicUrl;
}
