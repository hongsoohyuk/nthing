import { useState, type ReactNode } from 'react';
import { Bell, Search, MapPin } from 'lucide-react';
import { AppBar } from '../shared/components/AppBar';
import { BottomNav } from '../shared/components/BottomNav';
import { Badge, StatusBadge, Chip } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { Fab } from '../shared/components/Fab';
import { TextField } from '../shared/components/TextField';
import { LoadingState } from '../shared/components/states/LoadingState';
import { EmptyState } from '../shared/components/states/EmptyState';
import { ErrorState } from '../shared/components/states/ErrorState';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-b border-gray-200 px-4 py-6 dark:border-gray-700">
      <h2 className="text-h2 text-gray-900 dark:text-gray-50">{title}</h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

function Variant({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="text-meta text-gray-400">{label}</span>
      {children}
    </div>
  );
}

export function Catalog() {
  const [dark, setDark] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [chipActive, setChipActive] = useState<string | null>('전체');
  const [tab, setTab] = useState<'home' | 'map' | 'profile'>('home');

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
        <AppBar
          title="디자인 시스템 카탈로그"
          actions={
            <Button variant="secondary" size="md" onClick={toggleDark}>
              {dark ? '☀ Light' : '☾ Dark'}
            </Button>
          }
        />
      </div>

      <Section title="Buttons — variants × sizes × states">
        <Variant label="primary / lg">
          <Button>반띵할게요</Button>
        </Variant>
        <Variant label="primary / lg / loading">
          <Button loading>반띵할게요</Button>
        </Variant>
        <Variant label="primary / lg / disabled">
          <Button disabled>반띵할게요</Button>
        </Variant>
        <Variant label="primary / md">
          <Button size="md">반띵할게요</Button>
        </Variant>
        <Variant label="primary / lg / fullWidth">
          <div className="w-72">
            <Button fullWidth>반띵할게요</Button>
          </div>
        </Variant>
        <Variant label="secondary / lg">
          <Button variant="secondary">취소하기</Button>
        </Variant>
        <Variant label="secondary / md">
          <Button variant="secondary" size="md">
            취소
          </Button>
        </Variant>
        <Variant label="text">
          <Button variant="text">둘러보기</Button>
        </Variant>
      </Section>

      <Section title="Cards">
        <Variant label="default / md padding">
          <Card>
            <p className="text-body text-gray-900 dark:text-gray-50">기본 카드 — md padding, shadow-card</p>
          </Card>
        </Variant>
        <Variant label="sm padding">
          <Card padding="sm">
            <p className="text-body text-gray-900 dark:text-gray-50">컴팩트 — sm padding</p>
          </Card>
        </Variant>
        <Variant label="lg padding">
          <Card padding="lg">
            <p className="text-body text-gray-900 dark:text-gray-50">여백 — lg padding</p>
          </Card>
        </Variant>
        <Variant label="interactive (hover / active)">
          <Card interactive onClick={() => alert('card click')}>
            <p className="text-body text-gray-900 dark:text-gray-50">인터랙티브 — hover/active 시각 효과</p>
          </Card>
        </Variant>
      </Section>
      {/* NOTE: 도메인 컴포넌트 SplitCard는 Phase 1.4에서 features/splits/SplitCard.tsx로 별도 작성. 위 Card 데모는 primitive 변형만 보여주는 의도 */}

      <Section title="Badges">
        <Variant label="Badge tones">
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">brand</Badge>
            <Badge tone="success">success</Badge>
            <Badge tone="warning">warning</Badge>
            <Badge tone="error">error</Badge>
            <Badge tone="neutral">neutral</Badge>
          </div>
        </Variant>
        <Variant label="StatusBadge — 나눠사기 상태">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="WAITING" />
            <StatusBadge status="MATCHED" />
            <StatusBadge status="COMPLETED" />
            <StatusBadge status="CANCELLED" />
            <StatusBadge status="URGENT" />
          </div>
        </Variant>
      </Section>

      <Section title="Chips (필터)">
        <Variant label="active / inactive 토글">
          <div className="flex flex-wrap gap-2">
            {['전체', '모집중', '음식', '생필품', '마감임박'].map((label) => (
              <Chip
                key={label}
                active={chipActive === label}
                onClick={() => setChipActive(label)}
              >
                {label}
              </Chip>
            ))}
          </div>
        </Variant>
      </Section>

      <Section title="TextField">
        <Variant label="default">
          <div className="w-72">
            <TextField
              label="상품명"
              value={textValue}
              onChange={setTextValue}
              placeholder="예: 두쫀쿠 4개입"
            />
          </div>
        </Variant>
        <Variant label="supporting text">
          <div className="w-72">
            <TextField
              label="주소"
              value="역삼동 123-45 GS25"
              onChange={() => {}}
              supportingText="GPS: 37.5024, 127.0344"
              trailing={<MapPin className="size-5 text-brand dark:text-brand-dark-adj" />}
            />
          </div>
        </Variant>
        <Variant label="error">
          <div className="w-72">
            <TextField
              label="가격"
              value=""
              onChange={() => {}}
              placeholder="20000"
              error="가격을 입력해주세요"
            />
          </div>
        </Variant>
        <Variant label="disabled">
          <div className="w-72">
            <TextField label="잠긴 필드" value="고정값" onChange={() => {}} disabled />
          </div>
        </Variant>
      </Section>

      <Section title="AppBar">
        <Variant label="title only">
          <div className="w-72 border border-gray-200 dark:border-gray-700">
            <AppBar title="근처 반띵" />
          </div>
        </Variant>
        <Variant label="with back + actions">
          <div className="w-72 border border-gray-200 dark:border-gray-700">
            <AppBar
              title="상세"
              onBack={() => alert('back')}
              actions={
                <>
                  <button
                    type="button"
                    aria-label="검색"
                    className="inline-flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
                  >
                    <Search className="size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="알림"
                    className="inline-flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
                  >
                    <Bell className="size-5" />
                  </button>
                </>
              }
            />
          </div>
        </Variant>
      </Section>

      <Section title="BottomNav">
        <Variant label="홈/지도/나 활성 전환">
          <div className="w-72 border border-gray-200 dark:border-gray-700">
            <BottomNav current={tab} onSelect={setTab} />
          </div>
        </Variant>
      </Section>

      <Section title="FAB">
        <Variant label="primary +">
          <Fab label="반띵 등록" onClick={() => alert('FAB')} />
        </Variant>
      </Section>

      <Section title="States">
        <Variant label="Loading">
          <div className="w-72 rounded-lg border border-gray-200 dark:border-gray-700">
            <LoadingState />
          </div>
        </Variant>
        <Variant label="Loading (커스텀 메시지)">
          <div className="w-72 rounded-lg border border-gray-200 dark:border-gray-700">
            <LoadingState message="반띵 모으는 중…" />
          </div>
        </Variant>
        <Variant label="Empty">
          <div className="w-72 rounded-lg border border-gray-200 dark:border-gray-700">
            <EmptyState
              title="아직 반띵이 없어요"
              subtitle="첫 반띵을 올려보세요"
              action={<Button size="md">반띵 등록</Button>}
            />
          </div>
        </Variant>
        <Variant label="Error (with retry)">
          <div className="w-72 rounded-lg border border-gray-200 dark:border-gray-700">
            <ErrorState message="네트워크 오류" onRetry={() => alert('retry')} />
          </div>
        </Variant>
      </Section>
    </div>
  );
}
