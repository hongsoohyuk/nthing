import { ImageIcon } from 'lucide-react';
import { Card } from '../../shared/components/Card';
import { StatusBadge } from '../../shared/components/Badge';
import { type Split } from '../../shared/api/types';
import { formatPrice, formatDistance, formatRelativeTime } from '../../shared/lib/format';

type SplitCardProps = {
  split: Split;
  onClick?: () => void;
};

export function SplitCard({ split, onClick }: SplitCardProps) {
  const meta = [
    split.address,
    formatDistance(split.distanceKm),
    formatRelativeTime(split.createdAt),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card padding="sm" interactive={Boolean(onClick)} onClick={onClick} className="overflow-hidden">
      <div className="-m-3 mb-3 aspect-video bg-gray-100 dark:bg-gray-800">
        {split.imageUrl ? (
          <img src={split.imageUrl} alt={split.productName} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-8 text-gray-300" aria-hidden />
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-h2 text-gray-900 dark:text-gray-50">{split.productName}</h3>
        <StatusBadge status={split.status} />
      </div>
      <p className="mt-1 text-caption text-gray-500 dark:text-gray-400">{meta}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-body-em text-brand dark:text-brand-dark-adj">
          1인당 {formatPrice(split.pricePerPerson)}
        </span>
        <span className="text-caption text-gray-500 dark:text-gray-400">
          {split.splitCount}명 모집
        </span>
      </div>
    </Card>
  );
}
