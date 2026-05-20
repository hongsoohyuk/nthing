# Nthing Phase 1.2 — Design System Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `shared/components/`에 디자인 시스템 컴포넌트 (Button/Card/Badge/TextField/AppBar/BottomNav/FAB + Loading/Empty/Error) + `routes/Catalog.tsx` (모든 컴포넌트 시각 카탈로그) 구축. dev 서버에서 사용자가 시각 합의 가능한 상태.

**Architecture:** Tailwind 토큰 (Phase 1.1에서 셋업됨) 기반의 React 컴포넌트 라이브러리. 각 컴포넌트는 단일 책임, 명확한 props 인터페이스, dark mode 자동 지원 (`dark:` modifier). `clsx`로 conditional className 처리. Icon은 `lucide-react`. Catalog 페이지가 visual ground truth.

**Tech Stack (Phase 1.1에서 셋업됨):**
- Vite 8 + React 19 + TypeScript 6 + React Router 7
- Tailwind 3.4 + Pretendard + 전체 디자인 토큰 매핑
- TanStack Query 5 + Zustand 5 (이번 plan에선 직접 안 씀)
- Vitest 4 + React Testing Library 16

**이번 plan에서 추가되는 deps:**
- `clsx` — conditional className 헬퍼 (1KB, zero-dep)
- `lucide-react` — 아이콘 컴포넌트 (tree-shakeable)

**Out of scope (다음 plan):**
- API client, Zustand stores, OAuth (Phase 1.3)
- 실제 화면들 (Login/Home/Map/Detail 등 — Phase 1.4)
- 카카오맵, Camera, S3 업로드 (Phase 1.5)

---

## File Structure (이 plan에서 생기는/바뀌는 파일)

```
mobile/src/
├── shared/
│   ├── lib/
│   │   ├── queryClient.ts        # 기존 (변경 X)
│   │   └── cn.ts                 # 신규 — clsx + tailwind-merge 헬퍼
│   └── components/
│       ├── Button.tsx + .test.tsx
│       ├── Card.tsx + .test.tsx
│       ├── Badge.tsx + .test.tsx
│       ├── TextField.tsx + .test.tsx
│       ├── AppBar.tsx + .test.tsx
│       ├── BottomNav.tsx + .test.tsx
│       ├── Fab.tsx + .test.tsx
│       └── states/
│           ├── LoadingState.tsx + .test.tsx
│           ├── EmptyState.tsx + .test.tsx
│           └── ErrorState.tsx + .test.tsx
├── routes/
│   ├── Hello.tsx                 # 기존
│   ├── Hello.test.tsx            # 기존
│   └── Catalog.tsx               # 신규 — 모든 컴포넌트 시각 카탈로그
└── App.tsx                       # /catalog 라우트 추가
```

---

## Task 0: 사전 deps + cn 헬퍼

**Files:**
- Modify: `mobile/package.json` (clsx, lucide-react 추가)
- Create: `mobile/src/shared/lib/cn.ts`

- [ ] **Step 1: clsx + lucide-react 설치**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm add clsx lucide-react
```

- [ ] **Step 2: cn 헬퍼 생성 (clsx 래퍼)**

Create `mobile/src/shared/lib/cn.ts`:

```ts
import clsx, { type ClassValue } from 'clsx';

/**
 * className 합성 헬퍼.
 * 사용 예:
 *   cn('h-13 rounded-md', variant === 'primary' && 'bg-brand text-white')
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
```

- [ ] **Step 3: 빌드 확인**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm build
```

Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile): add clsx + lucide-react + cn helper for design system

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 1: Button

**Files:**
- Create: `mobile/src/shared/components/Button.tsx`
- Create: `mobile/src/shared/components/Button.test.tsx`

**Props 명세:**
- `variant`: 'primary' | 'secondary' | 'text' (default 'primary')
- `size`: 'md' | 'lg' (default 'lg' — height 52)
- `fullWidth?`: boolean
- `loading?`: boolean — true면 spinner + 클릭 비활성
- `disabled?`: boolean
- `children`: ReactNode
- `onClick?`: () => void
- `type?`: 'button' | 'submit' (default 'button')
- (button HTMLProps 나머지는 ...rest로 spread)

**디자인 토큰 매핑:**
- Primary: `bg-brand text-white` / pressed (active): `bg-brand-pressed` / disabled: `opacity-40`
- Secondary: `border border-gray-200 text-gray-800 bg-transparent dark:border-gray-700 dark:text-gray-100`
- Text: `text-gray-500 dark:text-gray-400` (no bg, no border)
- size lg: `h-13` (52px) + `px-5` + `text-body-em`
- size md: `h-11` (44px) + `px-4` + `text-body-em`
- 공통: `rounded-md inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:cursor-not-allowed`
- `fullWidth`: `w-full`

(`h-13` 같은 클래스는 Tailwind 기본 스케일에 없음 — `h-[52px]` 임의값 또는 `h-12` (48px)로 대체. 정확한 52px 위해 `h-[52px]` 사용 권장.)

- [ ] **Step 1: 테스트 작성 (failing)**

Create `mobile/src/shared/components/Button.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>반띵할게요</Button>);
    expect(screen.getByRole('button', { name: '반띵할게요' })).toBeInTheDocument();
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>tap</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when loading', async () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>loading</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is disabled when disabled prop true', () => {
    render(<Button disabled>x</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies fullWidth class', () => {
    render(<Button fullWidth>x</Button>);
    expect(screen.getByRole('button').className).toContain('w-full');
  });

  it('renders spinner when loading', () => {
    render(<Button loading aria-label="loading-button">x</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run shared/components/Button
```

Expected: FAIL — "Cannot find module './Button'".

- [ ] **Step 3: Button 구현**

Create `mobile/src/shared/components/Button.tsx`:

```tsx
import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/cn';

type Variant = 'primary' | 'secondary' | 'text';
type Size = 'md' | 'lg';

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

const variantClass: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-pressed active:bg-brand-pressed dark:bg-brand-dark-adj dark:hover:bg-brand dark:active:bg-brand',
  secondary:
    'border border-gray-200 bg-transparent text-gray-800 hover:bg-gray-50 active:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-900 dark:active:bg-gray-800',
  text: 'bg-transparent text-gray-500 hover:text-gray-700 active:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
};

const sizeClass: Record<Size, string> = {
  lg: 'h-[52px] px-5 text-body-em',
  md: 'h-11 px-4 text-body-em',
};

export function Button({
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variantClass[variant],
        sizeClass[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : children}
    </button>
  );
}
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run shared/components/Button
```

Expected: 6 tests passed.

- [ ] **Step 5: 빌드 + lint**

Run:
```bash
pnpm build && pnpm lint
```

Expected: 에러 없음.

- [ ] **Step 6: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile/components): add Button (primary/secondary/text + sizes + loading)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Card

**Files:**
- Create: `mobile/src/shared/components/Card.tsx`
- Create: `mobile/src/shared/components/Card.test.tsx`

**Props 명세:**
- `padding?`: 'sm' | 'md' | 'lg' (default 'md' = 16px)
- `interactive?`: boolean — true면 cursor-pointer + hover/active state
- `onClick?`: () => void
- `children`: ReactNode
- (div HTMLProps 나머지)

**디자인 토큰 매핑:**
- 기본: `bg-white shadow-card rounded-lg dark:bg-gray-900 dark:shadow-none dark:border dark:border-gray-700`
- padding sm: `p-3` / md: `p-4` / lg: `p-6`
- interactive: `cursor-pointer hover:shadow-raised active:shadow-card dark:hover:bg-gray-800 transition-shadow`

- [ ] **Step 1: 테스트 작성**

Create `mobile/src/shared/components/Card.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>두쫀쿠 4개입</Card>);
    expect(screen.getByText('두쫀쿠 4개입')).toBeInTheDocument();
  });

  it('fires onClick when interactive', async () => {
    const onClick = vi.fn();
    render(<Card interactive onClick={onClick}>card</Card>);
    await userEvent.click(screen.getByText('card'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders as div by default', () => {
    const { container } = render(<Card>x</Card>);
    expect(container.querySelector('div')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run shared/components/Card
```

Expected: FAIL.

- [ ] **Step 3: Card 구현**

Create `mobile/src/shared/components/Card.tsx`:

```tsx
import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

type Padding = 'sm' | 'md' | 'lg';

type CardProps = {
  padding?: Padding;
  interactive?: boolean;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

const paddingClass: Record<Padding, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  padding = 'md',
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-white shadow-card',
        'dark:bg-gray-900 dark:shadow-none dark:border dark:border-gray-700',
        paddingClass[padding],
        interactive &&
          'cursor-pointer transition-shadow hover:shadow-raised active:shadow-card dark:hover:bg-gray-800',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 + 빌드**

Run: `pnpm test:run shared/components/Card && pnpm build`

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile/components): add Card (sm/md/lg padding + interactive variant)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Badge / StatusBadge / Chip

**Files:**
- Create: `mobile/src/shared/components/Badge.tsx`
- Create: `mobile/src/shared/components/Badge.test.tsx`

**Components 명세 (한 파일 안에):**

1. `Badge` — 일반 pill badge
   - `tone?`: 'brand' | 'success' | 'warning' | 'error' | 'neutral' (default 'neutral')
   - `children`: ReactNode

2. `StatusBadge` — 나눠사기 상태 전용
   - `status`: 'WAITING' | 'MATCHED' | 'COMPLETED' | 'CANCELLED' | 'URGENT'
   - 매핑:
     - WAITING(모집중) → tone="brand" + label "모집중"
     - MATCHED(매칭됨) → tone="neutral" + label "매칭됨"
     - COMPLETED(완료) → tone="neutral" + label "완료"
     - CANCELLED(취소됨) → tone="neutral" + label "취소"
     - URGENT(마감임박) → tone="warning" + label "마감임박"
   - Badge를 wrapping

3. `Chip` — 필터/카테고리용 클릭 가능 pill
   - `active?`: boolean
   - `onClick?`: () => void
   - `children`: ReactNode

**디자인 토큰:**
- Badge 공통: `inline-flex items-center px-2 py-1 rounded-pill text-meta`
- tone brand: `bg-brand-surface text-brand dark:bg-brand-surface-dark dark:text-brand-dark-adj`
- tone success: `bg-success/10 text-success`
- tone warning: `bg-warning/10 text-warning`
- tone error: `bg-error/10 text-error`
- tone neutral: `bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400`

- Chip 공통: `inline-flex items-center px-3 py-1.5 rounded-pill text-caption transition-colors cursor-pointer`
- active: `bg-brand text-white border border-brand dark:bg-brand-dark-adj dark:border-brand-dark-adj`
- inactive: `bg-transparent text-gray-700 border border-gray-200 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-900`

- [ ] **Step 1: 테스트 작성**

Create `mobile/src/shared/components/Badge.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge, StatusBadge, Chip } from './Badge';

describe('Badge', () => {
  it('renders with text', () => {
    render(<Badge>NEW</Badge>);
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('uses brand tone classes', () => {
    render(<Badge tone="brand">x</Badge>);
    const el = screen.getByText('x');
    expect(el.className).toContain('text-brand');
  });
});

describe('StatusBadge', () => {
  it('shows 모집중 for WAITING', () => {
    render(<StatusBadge status="WAITING" />);
    expect(screen.getByText('모집중')).toBeInTheDocument();
  });

  it('shows 매칭됨 for MATCHED', () => {
    render(<StatusBadge status="MATCHED" />);
    expect(screen.getByText('매칭됨')).toBeInTheDocument();
  });

  it('shows 마감임박 for URGENT with warning tone', () => {
    render(<StatusBadge status="URGENT" />);
    const el = screen.getByText('마감임박');
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('text-warning');
  });
});

describe('Chip', () => {
  it('renders text and fires onClick', async () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>전체</Chip>);
    await userEvent.click(screen.getByText('전체'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows active state classes when active', () => {
    render(<Chip active>전체</Chip>);
    expect(screen.getByText('전체').className).toContain('bg-brand');
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail)**

Run: `pnpm test:run shared/components/Badge`. Expected: FAIL.

- [ ] **Step 3: Badge 구현**

Create `mobile/src/shared/components/Badge.tsx`:

```tsx
import { type ReactNode } from 'react';
import { cn } from '../lib/cn';

type Tone = 'brand' | 'success' | 'warning' | 'error' | 'neutral';

const toneClass: Record<Tone, string> = {
  brand:
    'bg-brand-surface text-brand dark:bg-brand-surface-dark dark:text-brand-dark-adj',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  neutral: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

type BadgeProps = {
  tone?: Tone;
  className?: string;
  children: ReactNode;
};

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-2 py-1 text-meta',
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

type Status = 'WAITING' | 'MATCHED' | 'COMPLETED' | 'CANCELLED' | 'URGENT';

const statusMap: Record<Status, { tone: Tone; label: string }> = {
  WAITING: { tone: 'brand', label: '모집중' },
  MATCHED: { tone: 'neutral', label: '매칭됨' },
  COMPLETED: { tone: 'neutral', label: '완료' },
  CANCELLED: { tone: 'neutral', label: '취소' },
  URGENT: { tone: 'warning', label: '마감임박' },
};

export function StatusBadge({ status }: { status: Status }) {
  const { tone, label } = statusMap[status];
  return <Badge tone={tone}>{label}</Badge>;
}

type ChipProps = {
  active?: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
};

export function Chip({ active = false, onClick, className, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex cursor-pointer items-center rounded-pill border px-3 py-1.5 text-caption transition-colors',
        active
          ? 'border-brand bg-brand text-white dark:border-brand-dark-adj dark:bg-brand-dark-adj'
          : 'border-gray-200 bg-transparent text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900',
        className,
      )}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 4: 테스트 + 빌드**

Run: `pnpm test:run shared/components/Badge && pnpm build`

- [ ] **Step 5: 커밋**

```bash
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile/components): add Badge + StatusBadge + Chip

WAITING/MATCHED/COMPLETED/CANCELLED/URGENT 상태별 매핑.
Chip은 필터/카테고리용 active/inactive 토글.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: TextField

**Files:**
- Create: `mobile/src/shared/components/TextField.tsx`
- Create: `mobile/src/shared/components/TextField.test.tsx`

**Props 명세:**
- `label`: string
- `value`: string
- `onChange`: (value: string) => void
- `placeholder?`: string
- `error?`: string — 있으면 error 상태로 표시
- `supportingText?`: string — error 없을 때 보조 텍스트 (예: GPS 좌표)
- `trailing?`: ReactNode — 우측 아이콘 슬롯
- `type?`: 'text' | 'number' | 'tel' (default 'text')
- `inputMode?`: 'text' | 'numeric' | 'decimal' (default 'text')
- `disabled?`: boolean
- `id?`: string (auto-generated if omitted)
- (input HTMLProps 나머지)

**디자인 토큰:**
- container: `flex flex-col gap-1`
- label: `text-meta text-gray-500 dark:text-gray-400`
- input wrapper: `flex h-[52px] items-center rounded-sm border bg-white px-4 transition-colors dark:bg-gray-900`
- input border default: `border-gray-200 dark:border-gray-700`
- input border focus-within: `border-brand ring-1 ring-brand` (focused via `focus-within` 가상클래스)
- input border error: `border-error ring-1 ring-error`
- input element: `flex-1 bg-transparent text-body text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100`
- supporting text: `text-caption text-gray-500 dark:text-gray-400`
- error text: `text-caption text-error`

- [ ] **Step 1: 테스트 작성**

Create `mobile/src/shared/components/TextField.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { TextField } from './TextField';

function Wrapper(props: { initial?: string; error?: string; supportingText?: string }) {
  const [value, setValue] = useState(props.initial ?? '');
  return (
    <TextField
      label="상품명"
      value={value}
      onChange={setValue}
      placeholder="예: 두쫀쿠 4개입"
      error={props.error}
      supportingText={props.supportingText}
    />
  );
}

describe('TextField', () => {
  it('renders label and placeholder', () => {
    render(<Wrapper />);
    expect(screen.getByText('상품명')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('예: 두쫀쿠 4개입')).toBeInTheDocument();
  });

  it('updates value via onChange', async () => {
    render(<Wrapper />);
    const input = screen.getByPlaceholderText('예: 두쫀쿠 4개입');
    await userEvent.type(input, '두쫀쿠');
    expect(input).toHaveValue('두쫀쿠');
  });

  it('shows supporting text when no error', () => {
    render(<Wrapper supportingText="GPS: 37.5024, 127.0344" />);
    expect(screen.getByText('GPS: 37.5024, 127.0344')).toBeInTheDocument();
  });

  it('shows error text and hides supporting when error', () => {
    render(<Wrapper supportingText="optional" error="required" />);
    expect(screen.getByText('required')).toBeInTheDocument();
    expect(screen.queryByText('optional')).not.toBeInTheDocument();
  });

  it('calls onChange with raw string value', async () => {
    const onChange = vi.fn();
    render(<TextField label="t" value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('t'), 'ab');
    expect(onChange).toHaveBeenLastCalledWith('ab');
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail)**

Run: `pnpm test:run shared/components/TextField`. Expected: FAIL.

- [ ] **Step 3: TextField 구현**

Create `mobile/src/shared/components/TextField.tsx`:

```tsx
import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  supportingText?: string;
  trailing?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>;

export function TextField({
  label,
  value,
  onChange,
  error,
  supportingText,
  trailing,
  id,
  className,
  disabled,
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hasError = Boolean(error);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={inputId} className="text-meta text-gray-500 dark:text-gray-400">
        {label}
      </label>
      <div
        className={cn(
          'flex h-[52px] items-center rounded-sm border bg-white px-4 transition-colors dark:bg-gray-900',
          hasError
            ? 'border-error ring-1 ring-error'
            : 'border-gray-200 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand dark:border-gray-700',
          disabled && 'opacity-50',
        )}
      >
        <input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          className="flex-1 bg-transparent text-body text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
          {...rest}
        />
        {trailing && <span className="ml-2 flex items-center">{trailing}</span>}
      </div>
      {hasError ? (
        <span className="text-caption text-error">{error}</span>
      ) : supportingText ? (
        <span className="text-caption text-gray-500 dark:text-gray-400">{supportingText}</span>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: 테스트 + 빌드**

Run: `pnpm test:run shared/components/TextField && pnpm build`

- [ ] **Step 5: 커밋**

```bash
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile/components): add TextField (label/error/supporting/trailing slot)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: AppBar

**Files:**
- Create: `mobile/src/shared/components/AppBar.tsx`
- Create: `mobile/src/shared/components/AppBar.test.tsx`

**Props 명세:**
- `title`: string
- `onBack?`: () => void — 있으면 좌측 ← 아이콘 표시
- `actions?`: ReactNode — 우측 슬롯 (아이콘 버튼 등)
- `transparent?`: boolean — true면 bg 없음 (상세 hero 이미지 위에 띄울 때)
- `align?`: 'left' | 'center' (default 'left')

**디자인 토큰:**
- container: `flex h-14 items-center px-2`
- bg default: `bg-white dark:bg-gray-950`
- bg transparent: 그대로 (no bg)
- back/action 버튼: `inline-flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-900`
- title: `text-h1 text-gray-900 dark:text-gray-50`
- align center: `flex-1 text-center`

- [ ] **Step 1: 테스트**

Create `mobile/src/shared/components/AppBar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppBar } from './AppBar';

describe('AppBar', () => {
  it('renders title', () => {
    render(<AppBar title="근처 반띵" />);
    expect(screen.getByText('근처 반띵')).toBeInTheDocument();
  });

  it('shows back button only when onBack provided', () => {
    const { rerender } = render(<AppBar title="t" />);
    expect(screen.queryByLabelText('뒤로가기')).not.toBeInTheDocument();
    const onBack = vi.fn();
    rerender(<AppBar title="t" onBack={onBack} />);
    expect(screen.getByLabelText('뒤로가기')).toBeInTheDocument();
  });

  it('fires onBack when back button clicked', async () => {
    const onBack = vi.fn();
    render(<AppBar title="t" onBack={onBack} />);
    await userEvent.click(screen.getByLabelText('뒤로가기'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('renders actions slot', () => {
    render(<AppBar title="t" actions={<button>알림</button>} />);
    expect(screen.getByText('알림')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail)**

Run: `pnpm test:run shared/components/AppBar`. Expected: FAIL.

- [ ] **Step 3: AppBar 구현**

Create `mobile/src/shared/components/AppBar.tsx`:

```tsx
import { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../lib/cn';

type AppBarProps = {
  title: string;
  onBack?: () => void;
  actions?: ReactNode;
  transparent?: boolean;
  align?: 'left' | 'center';
};

export function AppBar({
  title,
  onBack,
  actions,
  transparent = false,
  align = 'left',
}: AppBarProps) {
  return (
    <header
      className={cn(
        'flex h-14 items-center px-2',
        !transparent && 'bg-white dark:bg-gray-950',
      )}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로가기"
          className="inline-flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
        >
          <ArrowLeft className="size-5 text-gray-900 dark:text-gray-50" />
        </button>
      ) : (
        <span className="w-2" aria-hidden />
      )}
      <h1
        className={cn(
          'px-2 text-h1 text-gray-900 dark:text-gray-50',
          align === 'center' && 'flex-1 text-center',
          align === 'left' && 'flex-1',
        )}
      >
        {title}
      </h1>
      {actions && <div className="flex items-center gap-1 pr-2">{actions}</div>}
    </header>
  );
}
```

- [ ] **Step 4: 테스트 + 빌드**

Run: `pnpm test:run shared/components/AppBar && pnpm build`

- [ ] **Step 5: 커밋**

```bash
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile/components): add AppBar (back/title/actions, transparent variant)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: BottomNav

**Files:**
- Create: `mobile/src/shared/components/BottomNav.tsx`
- Create: `mobile/src/shared/components/BottomNav.test.tsx`

**Props 명세:**
- `current`: 'home' | 'map' | 'profile'
- `onSelect`: (tab: 'home' | 'map' | 'profile') => void

탭 3개 고정. 아이콘: Home / Map / User from lucide-react. 라벨: 홈 / 지도 / 나.

**디자인 토큰:**
- container: `flex h-16 items-stretch border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950`
- tab 버튼: `flex flex-1 flex-col items-center justify-center gap-1`
- icon (24): default `text-gray-400`, active `text-brand dark:text-brand-dark-adj`
- label (11px, weight 500/600): default `text-meta text-gray-400`, active `text-brand font-semibold dark:text-brand-dark-adj`

- [ ] **Step 1: 테스트**

Create `mobile/src/shared/components/BottomNav.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomNav } from './BottomNav';

describe('BottomNav', () => {
  it('renders 3 tab labels', () => {
    render(<BottomNav current="home" onSelect={vi.fn()} />);
    expect(screen.getByText('홈')).toBeInTheDocument();
    expect(screen.getByText('지도')).toBeInTheDocument();
    expect(screen.getByText('나')).toBeInTheDocument();
  });

  it('marks current tab with aria-current="page"', () => {
    render(<BottomNav current="map" onSelect={vi.fn()} />);
    const mapButton = screen.getByRole('button', { name: /지도/ });
    expect(mapButton).toHaveAttribute('aria-current', 'page');
  });

  it('fires onSelect with tab key', async () => {
    const onSelect = vi.fn();
    render(<BottomNav current="home" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /지도/ }));
    expect(onSelect).toHaveBeenCalledWith('map');
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail)**

Run: `pnpm test:run shared/components/BottomNav`. Expected: FAIL.

- [ ] **Step 3: BottomNav 구현**

Create `mobile/src/shared/components/BottomNav.tsx`:

```tsx
import { Home, Map, User, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

type Tab = 'home' | 'map' | 'profile';

type BottomNavProps = {
  current: Tab;
  onSelect: (tab: Tab) => void;
};

const tabs: Array<{ key: Tab; icon: LucideIcon; label: string }> = [
  { key: 'home', icon: Home, label: '홈' },
  { key: 'map', icon: Map, label: '지도' },
  { key: 'profile', icon: User, label: '나' },
];

export function BottomNav({ current, onSelect }: BottomNavProps) {
  return (
    <nav className="flex h-16 items-stretch border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950">
      {tabs.map(({ key, icon: Icon, label }) => {
        const isActive = key === current;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-current={isActive ? 'page' : undefined}
            className="flex flex-1 flex-col items-center justify-center gap-1"
          >
            <Icon
              className={cn(
                'size-6',
                isActive ? 'text-brand dark:text-brand-dark-adj' : 'text-gray-400',
              )}
            />
            <span
              className={cn(
                'text-meta',
                isActive
                  ? 'font-semibold text-brand dark:text-brand-dark-adj'
                  : 'text-gray-400',
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 4: 테스트 + 빌드**

Run: `pnpm test:run shared/components/BottomNav && pnpm build`

- [ ] **Step 5: 커밋**

```bash
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile/components): add BottomNav (홈/지도/나 3 tabs with active state)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: FAB

**Files:**
- Create: `mobile/src/shared/components/Fab.tsx`
- Create: `mobile/src/shared/components/Fab.test.tsx`

**Props 명세:**
- `onClick`: () => void
- `icon?`: ReactNode (default `<Plus />` from lucide-react)
- `label`: string — aria-label
- `className?`: string (위치 오버라이드 등)

**디자인 토큰:**
- 위치는 기본 안 지정 (호출 측이 `className`으로 `fixed bottom-20 right-4` 등 지정)
- 모양: `inline-flex size-14 items-center justify-center rounded-full bg-brand text-white shadow-raised transition-colors hover:bg-brand-pressed active:bg-brand-pressed dark:bg-brand-dark-adj`

- [ ] **Step 1: 테스트**

Create `mobile/src/shared/components/Fab.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Fab } from './Fab';

describe('Fab', () => {
  it('renders with aria-label', () => {
    render(<Fab label="등록" onClick={vi.fn()} />);
    expect(screen.getByLabelText('등록')).toBeInTheDocument();
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    render(<Fab label="x" onClick={onClick} />);
    await userEvent.click(screen.getByLabelText('x'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail)**

Run: `pnpm test:run shared/components/Fab`. Expected: FAIL.

- [ ] **Step 3: Fab 구현**

Create `mobile/src/shared/components/Fab.tsx`:

```tsx
import { type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../lib/cn';

type FabProps = {
  onClick: () => void;
  label: string;
  icon?: ReactNode;
  className?: string;
};

export function Fab({ onClick, label, icon, className }: FabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'inline-flex size-14 items-center justify-center rounded-full bg-brand text-white shadow-raised transition-colors',
        'hover:bg-brand-pressed active:bg-brand-pressed dark:bg-brand-dark-adj',
        className,
      )}
    >
      {icon ?? <Plus className="size-6" aria-hidden />}
    </button>
  );
}
```

- [ ] **Step 4: 테스트 + 빌드**

Run: `pnpm test:run shared/components/Fab && pnpm build`

- [ ] **Step 5: 커밋**

```bash
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile/components): add Fab (floating action button with Plus default icon)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: LoadingState / EmptyState / ErrorState

**Files:**
- Create: `mobile/src/shared/components/states/LoadingState.tsx`
- Create: `mobile/src/shared/components/states/EmptyState.tsx`
- Create: `mobile/src/shared/components/states/ErrorState.tsx`
- Create: `mobile/src/shared/components/states/states.test.tsx` (셋 한 파일)

**Props 명세:**

LoadingState:
- `message?`: string (default "불러오는 중…")
- spinner (Loader2) + 메시지를 중앙 정렬

EmptyState:
- `title`: string
- `subtitle?`: string
- `action?`: ReactNode (보통 Button)

ErrorState:
- `message`: string
- `onRetry?`: () => void — 있으면 "다시 시도" Secondary Button

**디자인 토큰:**
- 공통 wrapper: `flex flex-col items-center justify-center gap-3 p-8 text-center`
- spinner: `size-8 animate-spin text-brand dark:text-brand-dark-adj`
- title: `text-h2 text-gray-700 dark:text-gray-100`
- subtitle / message: `text-body text-gray-500 dark:text-gray-400`
- error icon (AlertCircle): `size-10 text-error`

- [ ] **Step 1: 테스트**

Create `mobile/src/shared/components/states/states.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

describe('LoadingState', () => {
  it('renders default message', () => {
    render(<LoadingState />);
    expect(screen.getByText('불러오는 중…')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<LoadingState message="반띵 모으는 중…" />);
    expect(screen.getByText('반띵 모으는 중…')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders title and subtitle', () => {
    render(<EmptyState title="아직 반띵이 없어요" subtitle="첫 반띵을 올려보세요" />);
    expect(screen.getByText('아직 반띵이 없어요')).toBeInTheDocument();
    expect(screen.getByText('첫 반띵을 올려보세요')).toBeInTheDocument();
  });

  it('renders action slot', () => {
    render(<EmptyState title="t" action={<button>등록</button>} />);
    expect(screen.getByText('등록')).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('renders message', () => {
    render(<ErrorState message="네트워크 오류" />);
    expect(screen.getByText('네트워크 오류')).toBeInTheDocument();
  });

  it('shows retry button when onRetry provided', async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="x" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('hides retry button when onRetry omitted', () => {
    render(<ErrorState message="x" />);
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail)**

Run: `pnpm test:run shared/components/states`. Expected: FAIL.

- [ ] **Step 3: 3개 컴포넌트 구현**

Create `mobile/src/shared/components/states/LoadingState.tsx`:

```tsx
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
```

Create `mobile/src/shared/components/states/EmptyState.tsx`:

```tsx
import { type ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function EmptyState({ title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <h2 className="text-h2 text-gray-700 dark:text-gray-100">{title}</h2>
      {subtitle && (
        <p className="text-body text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
```

Create `mobile/src/shared/components/states/ErrorState.tsx`:

```tsx
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
```

- [ ] **Step 4: 테스트 + 빌드**

Run: `pnpm test:run shared/components/states && pnpm build`

- [ ] **Step 5: 커밋**

```bash
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile/components): add LoadingState / EmptyState / ErrorState

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Catalog 페이지

**Files:**
- Create: `mobile/src/routes/Catalog.tsx`

**목적:** 모든 컴포넌트 + 변형 + 상태 + Light/Dark를 한 화면에 나열. 사용자가 dev 서버에서 시각 확인 + 다크 모드 토글.

**구조:**
- 헤더: "Nthing 디자인 시스템 카탈로그" + dark mode toggle (해당 토글이 `<html>`에 `class="dark"` 추가/제거)
- Section 별: Buttons / Cards / Badges / Chips / TextFields / AppBar / BottomNav / FAB / States
- 각 섹션은 컴포넌트 + 변형(variant/size/state) 나열, 라벨로 변형명 표시

- [ ] **Step 1: Catalog.tsx 작성**

Create `mobile/src/routes/Catalog.tsx`:

```tsx
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
```

- [ ] **Step 2: 빌드 + lint**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm build && pnpm lint
```

- [ ] **Step 3: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile/routes): add Catalog page — visual ground truth for design system

모든 컴포넌트 × variants × states × Light/Dark를 한 화면에 나열.
다크모드 토글로 시각 검증.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: /catalog 라우트 등록 + 최종 검증

**Files:**
- Modify: `mobile/src/App.tsx` (Catalog import + Route)

- [ ] **Step 1: App.tsx에 /catalog 라우트 추가**

Edit `mobile/src/App.tsx` — 기존 구조에 Catalog 라우트만 추가:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './shared/lib/queryClient';
import { Hello } from './routes/Hello';
import { Catalog } from './routes/Catalog';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Hello />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

- [ ] **Step 2: 최종 검증 — lint / format / test / build**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm lint
pnpm format:check
pnpm test:run
pnpm build
```

Expected: 모든 명령 에러 없음. test:run은 9개 test file (Hello + 7 component + 1 states) — 약 25-30 tests.

- [ ] **Step 3: dev 서버 띄우고 /catalog 응답 확인**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm dev > /tmp/catalog-test.log 2>&1 &
sleep 4
curl -s "http://localhost:5173/src/routes/Catalog.tsx" | grep -oE '(디자인 시스템 카탈로그|반띵할게요|모집중|마감임박)' | sort -u
pkill -f vite || true
```

Expected: 4개 키워드 모두 출력.

- [ ] **Step 4: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile): wire /catalog route for design system visual verification

Phase 1.2 Design System Components 완료. 사용자가 dev 서버에서
http://localhost:5173/catalog 로 모든 컴포넌트 시각 검증 가능.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: 결과 보고**

git log 출력:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git log --oneline -15
```

기대 결과:
- Phase 1.2 commits 10개 (Task 0 deps + Task 1-9 컴포넌트 + Task 10 라우트)
- mobile/src/shared/components/ 에 8개 컴포넌트 + 1 헬퍼
- mobile/src/routes/Catalog.tsx 시각 카탈로그
- `pnpm dev` → http://localhost:5173/catalog 에서 다크/라이트 토글 가능한 카탈로그
- 사용자가 시각 검증 후 미세조정 피드백 → 다음 iteration

---

## Phase 1.2 완료 후 다음 단계

- **사용자 시각 검증 + 피드백 사이클**: dev 서버에서 카탈로그 보고 spacing/컬러/인터랙션 미세조정
- **Phase 1.3 — API + Auth + OAuth**:
  - shared/api/nthingApi.ts (fetch + 토큰 인터셉터)
  - Zustand authStore + Capacitor Preferences 토큰 저장
  - LoginScreen + OAuth 4종 (웹 redirect via Capacitor Browser)
  - nthing:// deep link callback 처리
  - 자동 로그인
- **Phase 1.4 — Main Shell + Screens**: MainLayout (AppBar + BottomNav + FAB) + 7화면
- **Phase 1.5 — 네이티브 통합**: 카카오맵, Camera, Geolocation, S3 업로드
