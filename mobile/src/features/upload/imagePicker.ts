import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export type PickedImage = { blob: Blob; contentType: 'image/jpeg' | 'image/png' | 'image/webp' };

const ALLOWED: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];

function normalizeType(t: string): PickedImage['contentType'] {
  return ALLOWED.includes(t) ? (t as PickedImage['contentType']) : 'image/jpeg';
}

// 카메라/갤러리에서 사진 1장 선택. 취소/실패 시 null. (web fallback = 파일선택)
export async function pickImage(): Promise<PickedImage | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
    });
    if (!photo.webPath) return null;
    const res = await fetch(photo.webPath);
    const blob = await res.blob();
    return { blob, contentType: normalizeType(blob.type) };
  } catch {
    return null;
  }
}
