import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message }: LoadingStateProps) {
  const { t } = useTranslation();
  const text = message ?? t('states.loading');
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <Loader2 className="size-8 animate-spin text-brand dark:text-brand-dark-adj" aria-hidden />
      <p className="text-body text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );
}
