import { useTranslation } from 'react-i18next';
import { Badge } from '../../shared/components/Badge';
import { trustTone, useTrustProfile, type TrustTone } from './queries';

const TONE_STYLE: Record<TrustTone, { tone: 'success' | 'warning' | 'neutral'; labelKey: string }> =
  {
    newcomer: { tone: 'neutral', labelKey: 'trust.newcomer' },
    great: { tone: 'success', labelKey: 'trust.great' },
    good: { tone: 'success', labelKey: 'trust.good' },
    poor: { tone: 'warning', labelKey: 'trust.poor' },
  };

// 작성자/상대의 공개 신뢰도를 한 줄 배지로. 로딩/실패 시 아무것도 렌더하지 않음(비침투).
export function TrustBadge({ userId }: { userId: number | undefined }) {
  const { t } = useTranslation();
  const { data } = useTrustProfile(userId);
  if (!data) return null;

  const tone = trustTone(data);
  const { tone: badgeTone, labelKey } = TONE_STYLE[tone];
  const label =
    data.successRate != null
      ? `${t(labelKey)} · ${t('trust.successRate', { rate: data.successRate })}`
      : t(labelKey);

  return (
    <Badge tone={badgeTone} className="gap-1">
      {label}
    </Badge>
  );
}
