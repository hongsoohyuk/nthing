import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { AppBar } from '../shared/components/AppBar';
import { TextField } from '../shared/components/TextField';
import { Button } from '../shared/components/Button';
import { useCreateSplit } from '../features/splits/queries';
import { useLocationStore, DEFAULT_COORDS } from '../shared/stores/locationStore';
import { formatPrice } from '../shared/lib/format';

export function CreateSplit() {
  const navigate = useNavigate();
  const create = useCreateSplit();
  const coords = useLocationStore((s) => s.current) ?? DEFAULT_COORDS;

  const [productName, setProductName] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [totalQty, setTotalQty] = useState('');
  const [splitCount, setSplitCount] = useState('');
  const [address, setAddress] = useState('');

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
    !create.isPending;

  const onSubmit = () => {
    create.mutate(
      {
        productName: productName.trim(),
        totalPrice: priceNum,
        totalQty: qtyNum,
        splitCount: countNum,
        latitude: coords.lat,
        longitude: coords.lng,
        address: address.trim(),
        // imageUrl 은 Phase 1.5(사진 촬영 + S3 업로드)에서 채움
      },
      { onSuccess: (created) => navigate(`/splits/${created.id}`, { replace: true }) },
    );
  };

  return (
    <div className="flex h-screen flex-col">
      <AppBar title="내 반띵 올리기" onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="flex flex-col gap-4">
          {/* 사진 슬롯 — Phase 1.5 에서 카메라/갤러리 + S3 업로드 연결 */}
          <button
            type="button"
            disabled
            className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800"
          >
            <Camera className="size-7" aria-hidden />
            <span className="text-caption">사진 추가 (준비 중)</span>
          </button>

          <TextField label="상품명" value={productName} onChange={setProductName} placeholder="예: 두쫀쿠 4개입" />
          <TextField label="전체 가격" value={totalPrice} onChange={setTotalPrice} placeholder="20000" inputMode="numeric" />
          <TextField label="전체 수량" value={totalQty} onChange={setTotalQty} placeholder="4" inputMode="numeric" />
          <TextField label="나눌 인원" value={splitCount} onChange={setSplitCount} placeholder="2" inputMode="numeric" supportingText="최소 2명" />
          <TextField label="주소" value={address} onChange={setAddress} placeholder="만날 위치" />

          {/* 인당 가격 미리보기 — Card 대신 plain div (brand-surface 배경 충돌 회피) */}
          <div className="flex items-center justify-between rounded-lg bg-brand-surface p-4 dark:bg-brand-surface-dark">
            <span className="text-body text-gray-700 dark:text-gray-200">1인당 예상 가격</span>
            <span className="text-h1 text-brand dark:text-brand-dark-adj">{formatPrice(perPerson)}</span>
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
