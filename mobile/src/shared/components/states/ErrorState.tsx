import { AlertCircle } from 'lucide-react';
import { Button } from '../Button';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <AlertCircle className="size-10 text-error" aria-hidden />
      <p className="text-body text-gray-700 dark:text-gray-100">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="md" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </div>
  );
}
