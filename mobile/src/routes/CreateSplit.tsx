import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, Loader2 } from 'lucide-react';
import { AppBar } from '../shared/components/AppBar';
import { TextField } from '../shared/components/TextField';
import { Chip } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { useCreateSplit } from '../features/splits/queries';
import { useLocationStore, DEFAULT_COORDS } from '../shared/stores/locationStore';
import { formatPrice } from '../shared/lib/format';
import { pickImage } from '../features/upload/imagePicker';
import { uploadImage } from '../features/upload/uploadImage';
import {
  SPLIT_CATEGORIES,
  CATEGORY_LABEL_KEY,
  type SplitCategory,
} from '../shared/api/types';

export function CreateSplit() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const create = useCreateSplit();
  const coords = useLocationStore((s) => s.current) ?? DEFAULT_COORDS;

  const [category, setCategory] = useState<SplitCategory>('OTHER');
  const [productName, setProductName] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [totalQty, setTotalQty] = useState('');
  const [splitCount, setSplitCount] = useState('');
  const [address, setAddress] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const priceNum = Number(totalPrice);
  const qtyNum = Number(totalQty);
  const countNum = Number(splitCount);
  const perPerson = priceNum > 0 && countNum >= 2 ? Math.floor(priceNum / countNum) : 0;

  const canSubmit =
    productName.trim() !== '' &&
    priceNum >= 1 &&
    qtyNum >= 1 &&
    countNum >= 2 &&
    address.trim() !== '' &&
    !uploading &&
    !create.isPending;

  const onPickPhoto = () => {
    void (async () => {
      const picked = await pickImage();
      if (!picked) return;
      setUploadError(null);
      setUploading(true);
      try {
        const url = await uploadImage(picked);
        setImageUrl(url);
      } catch {
        setUploadError('사진 업로드에 실패했어요. 다시 시도해 주세요.');
      } finally {
        setUploading(false);
      }
    })();
  };

  const onSubmit = () => {
    create.mutate(
      {
        productName: productName.trim(),
        totalPrice: priceNum,
        totalQty: qtyNum,
        splitCount: countNum,
        category,
        latitude: coords.lat,
        longitude: coords.lng,
        address: address.trim(),
        ...(imageUrl ? { imageUrl } : {}),
      },
      { onSuccess: (created) => navigate(`/splits/${created.id}`, { replace: true }) },
    );
  };

  return (
    <div className="flex h-screen flex-col">
      <AppBar title="내 반띵 올리기" onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="flex flex-col gap-4">
          {/* 사진 슬롯 — 탭하면 카메라/갤러리 → S3 업로드 */}
          <button
            type="button"
            onClick={onPickPhoto}
            disabled={uploading}
            className="relative flex h-44 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="첨부 사진"
                className="absolute inset-0 size-full object-cover"
              />
            ) : uploading ? (
              <>
                <Loader2 className="size-7 animate-spin" aria-hidden />
                <span className="text-caption">업로드 중…</span>
              </>
            ) : (
              <>
                <Camera className="size-7" aria-hidden />
                <span className="text-caption">사진 추가</span>
              </>
            )}
          </button>
          {uploadError && <p className="text-caption text-error">{uploadError}</p>}

          <TextField
            label="상품명"
            value={productName}
            onChange={setProductName}
            placeholder="예: 두쫀쿠 4개입"
          />

          {/* 카테고리 선택 (기본 기타) */}
          <div className="flex flex-col gap-2">
            <span className="text-caption text-gray-500 dark:text-gray-400">카테고리</span>
            <div className="flex flex-wrap gap-2">
              {SPLIT_CATEGORIES.map((c) => (
                <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                  {t(CATEGORY_LABEL_KEY[c])}
                </Chip>
              ))}
            </div>
          </div>

          <TextField
            label="전체 가격"
            value={totalPrice}
            onChange={setTotalPrice}
            placeholder="20000"
            inputMode="numeric"
          />
          <TextField
            label="전체 수량"
            value={totalQty}
            onChange={setTotalQty}
            placeholder="4"
            inputMode="numeric"
          />
          <TextField
            label="나눌 인원"
            value={splitCount}
            onChange={setSplitCount}
            placeholder="2"
            inputMode="numeric"
            supportingText="최소 2명"
          />
          <TextField label="주소" value={address} onChange={setAddress} placeholder="만날 위치" />

          {/* 인당 가격 미리보기 — Card 대신 plain div (brand-surface 배경 충돌 회피) */}
          <div className="flex items-center justify-between rounded-lg bg-brand-surface p-4 dark:bg-brand-surface-dark">
            <span className="text-body text-gray-700 dark:text-gray-200">1인당 예상 가격</span>
            <span className="text-h1 text-brand dark:text-brand-dark-adj">
              {formatPrice(perPerson)}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <Button fullWidth disabled={!canSubmit} loading={create.isPending} onClick={onSubmit}>
          내 반띵 올리기
        </Button>
      </div>
    </div>
  );
}
