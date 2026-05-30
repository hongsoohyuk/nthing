import { BottomSheet } from '../../shared/components/BottomSheet';
import { Button } from '../../shared/components/Button';

type Props = { open: boolean; onAccept: () => void; onDismiss: () => void };

export function PushPrimingSheet({ open, onAccept, onDismiss }: Props) {
  return (
    <BottomSheet open={open} onClose={onDismiss}>
      <h2 className="text-h2 text-gray-900 dark:text-gray-50">근처 반띵 알림을 받을까요?</h2>
      <p className="mt-2 text-body text-gray-600 dark:text-gray-300">
        근처에 새 반띵이 올라오거나 내 반띵에 참여가 생기면 알려드려요.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <Button onClick={onAccept}>알림 받기</Button>
        <Button variant="text" onClick={onDismiss}>
          나중에
        </Button>
      </div>
    </BottomSheet>
  );
}
