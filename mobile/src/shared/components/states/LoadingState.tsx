import { Loader2 } from 'lucide-react';

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = '불러오는 중…' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <Loader2 className="size-8 animate-spin text-brand dark:text-brand-dark-adj" aria-hidden />
      <p className="text-body text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}
