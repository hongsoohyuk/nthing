# Nthing Phase 1.1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vite + React + TypeScript + Capacitor 6 셸을 셋업하고, Tailwind + 디자인 토큰 + Pretendard가 적용된 "Hello, Nthing" 상태까지 도달 — Android/iOS 빌드가 통과하는 빈 앱.

**Architecture:** 기존 KMP 코드를 `mobile-kmp/`로 git mv 아카이브 → `mobile/`을 새로 Vite scaffold → Capacitor 6 셸 추가 → Tailwind 토큰 매핑 → 기본 디렉토리 구조 + placeholder 화면.

**Tech Stack:** Vite 5 + React 18 + TypeScript (strict), Tailwind CSS 3.4, Pretendard, Capacitor 6 (iOS + Android), pnpm 11, Vitest + RTL, ESLint + Prettier.

**Prerequisites (확인됨):**
- Node 24+, pnpm 11+, Xcode 26+, Android Studio (가정), Git
- 모든 작업 디렉토리: `/Users/mzc01-tngur1120/dev/toy/one-bite`

**Out of scope (다음 plan에서):**
- API 클라이언트 / Zustand auth store / OAuth flow → Phase 1.3
- 디자인 시스템 컴포넌트 (Button/Card/Badge 등) → Phase 1.2
- 7화면 이식 → Phase 1.4
- 카카오맵 / Camera / Geolocation / S3 업로드 → Phase 1.5

---

## File Structure (이 plan에서 생기는/바뀌는 파일)

```
one-bite/
├── mobile-kmp/                         # git mv 결과 (기존 mobile/ 통째)
├── mobile/                             # 새로 생성
│   ├── android/                        # `npx cap add android` 결과
│   ├── ios/                            # `npx cap add ios` 결과
│   ├── public/
│   ├── src/
│   │   ├── main.tsx                    # Vite 기본 + Pretendard import
│   │   ├── App.tsx                     # 라우터 트리 + Provider 묶기
│   │   ├── routes/
│   │   │   └── Hello.tsx               # placeholder 화면 (brand 컬러 + Pretendard 검증)
│   │   ├── features/
│   │   │   ├── auth/.gitkeep
│   │   │   ├── splits/.gitkeep
│   │   │   ├── map/.gitkeep
│   │   │   ├── upload/.gitkeep
│   │   │   └── profile/.gitkeep
│   │   ├── shared/
│   │   │   ├── api/.gitkeep
│   │   │   ├── components/.gitkeep
│   │   │   ├── hooks/.gitkeep
│   │   │   ├── stores/.gitkeep
│   │   │   └── lib/.gitkeep
│   │   ├── styles/
│   │   │   └── index.css               # Tailwind base/components/utilities + Pretendard
│   │   ├── test/
│   │   │   └── setup.ts                # vitest + RTL setup
│   │   └── vite-env.d.ts
│   ├── capacitor.config.ts
│   ├── tailwind.config.ts              # 디자인 토큰 매핑
│   ├── postcss.config.js
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── .eslintrc.cjs
│   ├── .prettierrc
│   ├── .prettierignore
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   └── README.md
└── CLAUDE.md                           # 이미 업데이트됨 (변경 없음)
```

---

## Task 1: 기존 mobile/ → mobile-kmp/ 아카이브

**Files:**
- Rename: `mobile/` → `mobile-kmp/` (디렉토리 통째)
- Modify: 없음 (CLAUDE.md는 이미 업데이트됨)

- [ ] **Step 1: 현재 git 상태 확인 — 깨끗해야 안전**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git status
```

Expected: working tree가 깨끗해야 함. 아니면 미리 stash/commit. `.serena/project.yml` 등 잡다한 변경은 별도 commit으로 정리.

- [ ] **Step 2: git mv로 디렉토리 이름 변경**

Run:
```bash
git mv mobile mobile-kmp
```

이건 mobile/ 안의 모든 파일을 mobile-kmp/로 옮기는 git 명령. history 보존.

- [ ] **Step 3: 변경 확인**

Run:
```bash
git status
```

Expected: 수많은 `renamed: mobile/... -> mobile-kmp/...` 라인.

- [ ] **Step 4: 커밋**

```bash
git commit -m "$(cat <<'EOF'
chore(mobile): archive KMP client to mobile-kmp/ for rewrite

기존 KMP + Compose Multiplatform 클라이언트를 mobile-kmp/로 보존.
새 Vite + React + Capacitor 클라이언트가 mobile/ 자리에 들어옴.
참고: docs/superpowers/specs/2026-05-18-client-rewrite-design.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: 결과 확인**

Run: `ls /Users/mzc01-tngur1120/dev/toy/one-bite/` — `mobile-kmp/`만 보이고 `mobile/`는 없어야 함.

---

## Task 2: Vite + React + TS scaffold

**Files:**
- Create: `mobile/` (전체 — Vite scaffold 결과)

- [ ] **Step 1: pnpm으로 Vite React+TS 템플릿 scaffold**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
pnpm create vite mobile --template react-ts
```

Expected: `mobile/` 디렉토리 생성. `package.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `index.html` 등 표준 Vite 구조.

- [ ] **Step 2: 의존성 설치**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm install
```

- [ ] **Step 3: dev 서버 확인 (백그라운드 띄우고 fetch로 ping)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm dev &
sleep 3
curl -sI http://localhost:5173 | head -1
kill %1
```

Expected: `HTTP/1.1 200 OK` (또는 `200 OK`). 다른 포트면 vite가 어떤 포트를 잡았는지 출력에서 확인.

- [ ] **Step 4: 빌드 확인**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm build
```

Expected: `dist/` 생성. 에러 없음.

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile): scaffold Vite + React + TypeScript

pnpm create vite mobile --template react-ts. Default Vite 기본 구조.
다음 task에서 Tailwind/Capacitor/디자인 토큰 추가.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Tailwind CSS 설치 + 기본 셋업

**Files:**
- Create: `mobile/tailwind.config.ts`, `mobile/postcss.config.js`, `mobile/src/styles/index.css`
- Modify: `mobile/src/main.tsx` (CSS import 추가)
- Delete: `mobile/src/index.css`, `mobile/src/App.css` (Vite 기본 CSS — Tailwind로 대체)

- [ ] **Step 1: Tailwind + PostCSS 설치**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm add -D tailwindcss@^3.4 postcss autoprefixer
npx tailwindcss init -p --ts
```

Expected: `tailwind.config.ts`와 `postcss.config.js` 생성.

- [ ] **Step 2: tailwind.config.ts content paths 설정 (디자인 토큰은 다음 task에서)**

Edit `mobile/tailwind.config.ts` (npx init 결과를 통째 교체):

```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 3: Tailwind 디렉티브가 들어간 styles/index.css 생성**

Create `mobile/src/styles/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: 기존 Vite 기본 CSS 제거 + main.tsx import 변경**

Delete:
```bash
rm mobile/src/index.css mobile/src/App.css
```

Edit `mobile/src/main.tsx` — `./index.css` import를 `./styles/index.css`로 변경. 또한 `App.css` import도 제거 (App.tsx 안에 있을 수 있음).

```tsx
// mobile/src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Edit `mobile/src/App.tsx` — Vite 템플릿의 모든 내용을 단순한 한 줄로 교체 (다음 task에서 디자인 토큰 검증용으로 다시 손댐):

```tsx
function App() {
  return <div className="p-4 text-2xl">Tailwind OK</div>;
}

export default App;
```

- [ ] **Step 5: dev 서버에서 Tailwind 클래스가 먹는지 확인**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm dev &
sleep 3
curl -s http://localhost:5173 | grep -o 'Tailwind OK'
kill %1
```

Expected: `Tailwind OK` 출력 (HTML에 포함됨).

- [ ] **Step 6: 빌드 확인**

Run: `pnpm build`. Expected: 에러 없음.

- [ ] **Step 7: 커밋**

```bash
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile): add Tailwind CSS + PostCSS

기본 셋업만 (디자인 토큰은 다음 commit에서). Vite 기본 CSS 제거,
styles/index.css에 Tailwind 디렉티브 셋업.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Pretendard 폰트 + 디자인 토큰 매핑

**Files:**
- Modify: `mobile/src/styles/index.css` (Pretendard @import 추가)
- Modify: `mobile/tailwind.config.ts` (전체 디자인 토큰 매핑)
- Modify: `mobile/src/App.tsx` (토큰 시각 검증용 placeholder)

- [ ] **Step 1: styles/index.css에 Pretendard CDN import + body 폰트 적용**

Edit `mobile/src/styles/index.css`:

```css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body, #root {
    height: 100%;
  }
  body {
    @apply font-sans text-gray-900 bg-white antialiased;
  }
}
```

- [ ] **Step 2: tailwind.config.ts에 전체 디자인 토큰 매핑**

Edit `mobile/tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#16A34A',
          pressed: '#15803D',
          surface: '#DCFCE7',
          'surface-dark': '#14271A',
          'dark-adj': '#22C55E',
        },
        gray: {
          50:  '#FAFAFA', 100: '#F4F4F5', 200: '#E4E4E7',
          300: '#D4D4D8', 400: '#A1A1AA', 500: '#71717A',
          600: '#52525B', 700: '#3F3F46', 800: '#27272A',
          900: '#18181B', 950: '#09090B',
        },
        success: { DEFAULT: '#0EA5E9', dark: '#38BDF8' },
        warning: { DEFAULT: '#F59E0B', dark: '#FBBF24' },
        error:   { DEFAULT: '#DC2626', dark: '#EF4444' },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display:   ['28px', { lineHeight: '36px', fontWeight: '700' }],
        h1:        ['22px', { lineHeight: '30px', fontWeight: '700' }],
        h2:        ['18px', { lineHeight: '26px', fontWeight: '600' }],
        body:      ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'body-em': ['15px', { lineHeight: '22px', fontWeight: '600' }],
        caption:   ['13px', { lineHeight: '18px', fontWeight: '400' }],
        meta:      ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
      borderRadius: {
        sm: '8px', md: '10px', lg: '12px', xl: '16px', pill: '999px',
      },
      boxShadow: {
        card:    '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
        raised:  '0 4px 12px rgba(0,0,0,0.08)',
        overlay: '0 8px 24px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 3: App.tsx에 디자인 토큰 시각 검증 placeholder**

Edit `mobile/src/App.tsx`:

```tsx
function App() {
  return (
    <div className="min-h-screen p-6 space-y-4">
      <h1 className="text-display text-brand">Nthing</h1>
      <p className="text-body text-gray-500">반띵하자 — 디자인 토큰 검증</p>
      <div className="space-y-2">
        <button className="rounded-md bg-brand px-5 py-3 text-white text-body-em">
          반띵할게요
        </button>
        <div className="flex gap-2">
          <span className="rounded-pill bg-brand-surface px-2 py-1 text-meta text-brand">
            모집중
          </span>
          <span className="rounded-pill bg-warning/10 px-2 py-1 text-meta text-warning">
            마감임박
          </span>
          <span className="rounded-pill bg-gray-100 px-2 py-1 text-meta text-gray-500">
            매칭됨
          </span>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-card">
          <p className="text-h2">두쫀쿠 4개입</p>
          <p className="text-caption text-gray-500">역삼동 GS25 · 320m · 5분 전</p>
          <p className="text-body-em text-brand">1인당 ₩10,000</p>
        </div>
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 4: 브라우저에서 시각 검증 (HTML 응답에 토큰 클래스가 박혀있는지)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm dev &
sleep 3
curl -s http://localhost:5173 | grep -oE '(Nthing|반띵|bg-brand|text-display)' | sort -u
kill %1
```

Expected: 위 키워드들이 출력되어야 (HTML 내 텍스트는 React 렌더 결과라 보이고, 클래스명은 JSX로 들어가 있음).

- [ ] **Step 5: 빌드 확인**

Run: `pnpm build`. Expected: 에러 없음, dist 안에 CSS가 Pretendard import + 토큰 정의 포함.

- [ ] **Step 6: 커밋**

```bash
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile): add Pretendard + design tokens (BrandGreen + Gray scale)

tailwind.config.ts에 디자인 토큰 일괄 매핑.
App.tsx placeholder로 토큰 시각 검증.
docs/superpowers/specs/2026-05-18-client-rewrite-design.md 섹션 3 참조.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: React Router + 기본 라우트 트리

**Files:**
- Create: `mobile/src/routes/Hello.tsx`
- Modify: `mobile/src/App.tsx` (BrowserRouter + 라우트 정의)
- Modify: `mobile/package.json` (react-router-dom 추가)

- [ ] **Step 1: react-router-dom 설치**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm add react-router-dom
```

- [ ] **Step 2: routes/Hello.tsx 생성**

Create `mobile/src/routes/Hello.tsx`:

```tsx
export function Hello() {
  return (
    <div className="min-h-screen p-6 space-y-4">
      <h1 className="text-display text-brand">Nthing</h1>
      <p className="text-body text-gray-500">반띵하자 — Phase 1.1 Foundation OK</p>
    </div>
  );
}
```

- [ ] **Step 3: App.tsx를 BrowserRouter + 라우트 트리로 교체**

Edit `mobile/src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Hello } from './routes/Hello';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hello />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 4: dev 서버 확인**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm dev &
sleep 3
curl -s http://localhost:5173 | grep -o 'Phase 1.1 Foundation OK'
kill %1
```

Expected: `Phase 1.1 Foundation OK` 출력.

- [ ] **Step 5: 빌드 확인**

Run: `pnpm build`. Expected: 에러 없음.

- [ ] **Step 6: 커밋**

```bash
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile): add React Router + placeholder Hello route

Phase 1.1 Foundation 완료 placeholder. 다음 plan에서 실제 라우트 트리 구축.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Zustand + TanStack Query 셋업 (Provider만)

**Files:**
- Create: `mobile/src/shared/lib/queryClient.ts`
- Modify: `mobile/src/App.tsx` (QueryClientProvider 래핑)
- Modify: `mobile/package.json` (zustand + @tanstack/react-query 추가)

- [ ] **Step 1: Zustand + TanStack Query 설치**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm add zustand @tanstack/react-query
```

- [ ] **Step 2: QueryClient 인스턴스 생성**

Create `mobile/src/shared/lib/queryClient.ts`:

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

- [ ] **Step 3: App.tsx에 QueryClientProvider 래핑**

Edit `mobile/src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './shared/lib/queryClient';
import { Hello } from './routes/Hello';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Hello />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

- [ ] **Step 4: dev 서버 확인 (이전과 동일하게 Phase 1.1 Foundation OK 출력)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm dev &
sleep 3
curl -s http://localhost:5173 | grep -o 'Phase 1.1 Foundation OK'
kill %1
```

Expected: `Phase 1.1 Foundation OK`. (Provider 추가가 렌더에 영향 없어야)

- [ ] **Step 5: 빌드 확인**

Run: `pnpm build`. Expected: 에러 없음.

- [ ] **Step 6: 커밋**

```bash
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile): add Zustand + TanStack Query (provider only)

QueryClientProvider만 셋업. 실제 store/queries는 다음 plan에서.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: ESLint + Prettier

**Files:**
- Create: `mobile/.eslintrc.cjs`, `mobile/.prettierrc`, `mobile/.prettierignore`
- Modify: `mobile/package.json` (scripts + devDeps)

- [ ] **Step 1: ESLint + Prettier 의존성 설치**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh prettier eslint-config-prettier
```

(Vite scaffold가 이미 eslint 일부를 설치했을 수 있음 — 위 명령으로 표준 셋 확보.)

- [ ] **Step 2: .eslintrc.cjs 생성**

Create `mobile/.eslintrc.cjs`:

```js
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react', 'react-refresh'],
  settings: { react: { version: 'detect' } },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
  ignorePatterns: ['dist', 'android', 'ios', 'node_modules', '*.cjs', 'vite.config.ts', 'vitest.config.ts', 'tailwind.config.ts', 'postcss.config.js'],
};
```

- [ ] **Step 3: .prettierrc, .prettierignore 생성**

Create `mobile/.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

Create `mobile/.prettierignore`:

```
node_modules
dist
android
ios
pnpm-lock.yaml
```

- [ ] **Step 4: package.json scripts 추가**

Edit `mobile/package.json` — `scripts` 섹션에 다음을 머지 (기존 dev/build/preview는 유지):

```json
{
  "scripts": {
    "lint": "eslint . --ext ts,tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css}\""
  }
}
```

- [ ] **Step 5: lint + format 실행으로 검증**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm format
pnpm lint
```

Expected: 에러 없음 (warning은 OK).

- [ ] **Step 6: 커밋**

```bash
git add mobile/
git commit -m "$(cat <<'EOF'
chore(mobile): add ESLint + Prettier with React/TS presets

기본 룰 + react/react-hooks/refresh. prettier 통합.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Vitest + React Testing Library

**Files:**
- Create: `mobile/vitest.config.ts`, `mobile/src/test/setup.ts`, `mobile/src/routes/Hello.test.tsx`
- Modify: `mobile/package.json` (scripts + devDeps), `mobile/tsconfig.json` (vitest globals 타입 추가)

- [ ] **Step 1: Vitest + RTL 설치**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: vitest.config.ts 생성**

Create `mobile/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

- [ ] **Step 3: src/test/setup.ts 생성 (RTL matchers)**

Create `mobile/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 4: tsconfig.json에 vitest globals + jest-dom 타입 추가**

Edit `mobile/tsconfig.json` — `compilerOptions.types` 에 다음 추가 (기존 types가 있다면 머지):

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

- [ ] **Step 5: package.json scripts 추가**

Edit `mobile/package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui"
  }
}
```

- [ ] **Step 6: Hello 라우트 hello-world 테스트 작성**

Create `mobile/src/routes/Hello.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hello } from './Hello';

describe('Hello', () => {
  it('renders Nthing wordmark', () => {
    render(<Hello />);
    expect(screen.getByText('Nthing')).toBeInTheDocument();
    expect(screen.getByText(/Phase 1.1 Foundation OK/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: 테스트 실행**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run
```

Expected: 1 passed.

- [ ] **Step 8: 커밋**

```bash
git add mobile/
git commit -m "$(cat <<'EOF'
test(mobile): setup Vitest + RTL with Hello smoke test

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: 디렉토리 구조 + .gitkeep

**Files:**
- Create: `mobile/src/{features,shared,routes}/...` 디렉토리 + `.gitkeep` 파일들

- [ ] **Step 1: 디렉토리와 .gitkeep 만들기**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile/src
mkdir -p features/auth features/splits features/map features/upload features/profile
mkdir -p shared/api shared/components shared/hooks shared/stores
# shared/lib과 routes는 이미 존재
for d in features/auth features/splits features/map features/upload features/profile shared/api shared/components shared/hooks shared/stores; do
  touch "$d/.gitkeep"
done
```

- [ ] **Step 2: 디렉토리 구조 확인**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
find src -type d | sort
```

Expected:
```
src
src/features
src/features/auth
src/features/map
src/features/profile
src/features/splits
src/features/upload
src/routes
src/shared
src/shared/api
src/shared/components
src/shared/hooks
src/shared/lib
src/shared/stores
src/styles
src/test
```

- [ ] **Step 3: 커밋**

```bash
git add mobile/
git commit -m "$(cat <<'EOF'
chore(mobile): scaffold src directory structure (features/shared/routes)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Capacitor core 설치 + init

**Files:**
- Create: `mobile/capacitor.config.ts`
- Modify: `mobile/package.json` (Capacitor 의존성)

- [ ] **Step 1: Capacitor core + CLI 설치**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm add @capacitor/core @capacitor/cli@latest
```

- [ ] **Step 2: capacitor init**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
npx cap init "Nthing" co.nthing.app --web-dir dist
```

Expected: `capacitor.config.ts` 생성. 내용:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.nthing.app',
  appName: 'Nthing',
  webDir: 'dist',
};

export default config;
```

만약 init이 인터랙티브 모드로 들어가면 위 값을 입력. 또는 `npx cap init --inline-config` 옵션 활용.

- [ ] **Step 3: 빌드 검증 (Capacitor add 전에 dist/ 가 있어야 함)**

Run: `pnpm build`. Expected: `dist/` 존재.

- [ ] **Step 4: 커밋**

```bash
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile): init Capacitor 6 (app id co.nthing.app)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Capacitor iOS 플랫폼 추가

**Files:**
- Create: `mobile/ios/` (Capacitor 자동 생성)
- Modify: `mobile/package.json` (@capacitor/ios 추가)

- [ ] **Step 1: @capacitor/ios 설치**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm add @capacitor/ios
```

- [ ] **Step 2: iOS 플랫폼 추가**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
npx cap add ios
```

Expected: `mobile/ios/App/App.xcodeproj` 등 Xcode 프로젝트 구조 생성.
CocoaPods가 자동 실행됨. CocoaPods 미설치 시 `sudo gem install cocoapods` 가이드 출력될 수 있음.

- [ ] **Step 3: sync (build 결과를 iOS 셸로)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
npx cap sync ios
```

Expected: `sync ios in Xs` 출력. 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile): add Capacitor iOS platform

npx cap add ios + sync. Xcode 프로젝트 mobile/ios/.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Capacitor Android 플랫폼 추가

**Files:**
- Create: `mobile/android/` (Capacitor 자동 생성)
- Modify: `mobile/package.json` (@capacitor/android 추가)

- [ ] **Step 1: @capacitor/android 설치**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm add @capacitor/android
```

- [ ] **Step 2: Android 플랫폼 추가**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
npx cap add android
```

Expected: `mobile/android/` Android Gradle 프로젝트 구조 생성.

- [ ] **Step 3: sync**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
npx cap sync android
```

Expected: 에러 없음.

- [ ] **Step 4: Android Gradle 빌드 검증**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile/android
./gradlew assembleDebug --no-daemon
```

Expected: `BUILD SUCCESSFUL`. APK가 `android/app/build/outputs/apk/debug/app-debug.apk`에 생성.

(Gradle 첫 빌드는 시간이 걸림. 10분+ 잡고 진행.)

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile): add Capacitor Android platform + verify assembleDebug

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Deep link scheme (iOS Info.plist)

**Files:**
- Modify: `mobile/ios/App/App/Info.plist`

- [ ] **Step 1: Info.plist 위치 확인 + 현재 내용 일부 확인**

Run:
```bash
ls /Users/mzc01-tngur1120/dev/toy/one-bite/mobile/ios/App/App/Info.plist
grep -A 2 CFBundleURLTypes /Users/mzc01-tngur1120/dev/toy/one-bite/mobile/ios/App/App/Info.plist || echo "no URL types yet"
```

- [ ] **Step 2: CFBundleURLTypes 항목 추가**

Edit `mobile/ios/App/App/Info.plist` — `</dict>` 직전(가장 바깥 dict의 마지막)에 다음 블록 삽입:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>co.nthing.app</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>nthing</string>
        </array>
    </dict>
</array>
```

만약 이미 CFBundleURLTypes가 있다면, 새 `<dict>` 항목만 array 안에 추가.

- [ ] **Step 3: 변경 확인**

Run:
```bash
grep -A 10 CFBundleURLTypes /Users/mzc01-tngur1120/dev/toy/one-bite/mobile/ios/App/App/Info.plist
```

Expected: 위에서 넣은 XML이 출력.

- [ ] **Step 4: cap sync ios 다시 (Info.plist 변경 반영)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
npx cap sync ios
```

- [ ] **Step 5: 커밋**

```bash
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile/ios): add nthing:// URL scheme for OAuth deep link

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Deep link scheme (Android Manifest)

**Files:**
- Modify: `mobile/android/app/src/main/AndroidManifest.xml`

- [ ] **Step 1: 현재 MainActivity 블록 확인**

Run:
```bash
sed -n '/<activity/,/<\/activity>/p' /Users/mzc01-tngur1120/dev/toy/one-bite/mobile/android/app/src/main/AndroidManifest.xml
```

Expected: 기본 MainActivity와 LAUNCHER intent-filter가 보임.

- [ ] **Step 2: nthing:// scheme intent-filter 추가**

Edit `mobile/android/app/src/main/AndroidManifest.xml` — MainActivity의 `</activity>` 직전에 새 intent-filter 추가:

```xml
<intent-filter android:autoVerify="false">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="nthing" />
</intent-filter>
```

- [ ] **Step 3: cap sync + Gradle assembleDebug 재확인**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
npx cap sync android
cd android && ./gradlew assembleDebug --no-daemon
```

Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 4: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/
git commit -m "$(cat <<'EOF'
feat(mobile/android): add nthing:// scheme intent-filter for OAuth deep link

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: mobile/.gitignore 보강

**Files:**
- Modify: `mobile/.gitignore` (Vite scaffold 기본 + Capacitor/iOS/Android 산출물 추가)

- [ ] **Step 1: 현재 .gitignore 내용 확인**

Run: `cat /Users/mzc01-tngur1120/dev/toy/one-bite/mobile/.gitignore`

- [ ] **Step 2: Capacitor/iOS/Android 산출물 추가 (기존 내용 끝에 append)**

Edit `mobile/.gitignore` — 끝에 추가:

```
# Capacitor / iOS
ios/App/Pods/
ios/App/Podfile.lock
ios/.DS_Store
ios/App/build/

# Android
android/.gradle/
android/build/
android/app/build/
android/local.properties
android/.idea/
android/captures/

# Capacitor runtime
android/app/src/main/assets/public/
ios/App/App/public/
```

(Capacitor의 `cap sync`는 `public/` 디렉토리에 빌드 결과를 복사. 이건 ignore하는 게 표준 — 빌드 결과는 source 아님.)

- [ ] **Step 3: 변경 확인 + 영향 받는 파일 정리**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git status mobile/
```

Expected: `.gitignore` modified만. (public/ 디렉토리 등은 직전 task에서 add됐을 수도 — 만약 그렇다면 `git rm -r --cached <path>`로 untrack 후 ignore에 맡김.)

만약 위 ignore 패턴에 해당하는 파일이 이미 staged/tracked면:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
git rm -r --cached android/app/src/main/assets/public/ ios/App/App/public/ 2>/dev/null || true
```

- [ ] **Step 4: 커밋**

```bash
git add mobile/.gitignore
git commit -m "$(cat <<'EOF'
chore(mobile): expand .gitignore for Capacitor iOS/Android artifacts

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: README + 환경변수 문서화

**Files:**
- Create: `mobile/README.md`

- [ ] **Step 1: README 작성**

Create `mobile/README.md`:

```markdown
# mobile/ — Nthing 클라이언트 (Vite + React + Capacitor)

Phase 1.1 Foundation 완료 상태. 다음 plan들에서 디자인 시스템 컴포넌트 / API / 화면 / 카카오맵 등 추가.

## Stack
- Vite 5 + React 18 + TypeScript (strict)
- Tailwind CSS 3.4 + Pretendard
- Zustand + TanStack Query
- React Router v6
- Capacitor 6 (iOS + Android)
- Vitest + React Testing Library

## Setup
\`\`\`bash
pnpm install
\`\`\`

## Scripts
\`\`\`bash
pnpm dev            # Vite dev 서버 (브라우저)
pnpm build          # 정적 빌드 → dist/
pnpm preview        # 빌드 결과 미리보기
pnpm lint           # ESLint
pnpm format         # Prettier 적용
pnpm format:check   # Prettier 검사
pnpm test           # Vitest watch
pnpm test:run       # Vitest 1회
\`\`\`

## Mobile (Capacitor)
\`\`\`bash
pnpm build && npx cap sync           # 모든 플랫폼 동기화
npx cap open ios                     # Xcode 열기
npx cap open android                 # Android Studio 열기
\`\`\`

## Environment Variables (다음 plan에서 채워질 .env)
- \`VITE_API_BASE_URL\` — 서버 base URL (예: http://<EIP>/api 또는 https://api.nthing.co)
- \`VITE_KAKAO_JS_KEY\`
- \`VITE_KAKAO_REST_KEY\`
- \`VITE_NAVER_CLIENT_ID\`
- \`VITE_NAVER_REDIRECT_URI\`
- \`VITE_GOOGLE_CLIENT_ID\`
- \`VITE_APPLE_CLIENT_ID\`
- \`VITE_KAKAOMAP_APP_KEY\`

(.env는 .gitignore에 포함. 로컬에서는 \`mobile/.env\`로 관리.)

## Deep link scheme
- \`nthing://\` — OAuth 콜백 등에 사용 (Info.plist + AndroidManifest 셋업됨)

## Reference
- 마이그레이션 spec: \`docs/superpowers/specs/2026-05-18-client-rewrite-design.md\`
- Phase 1.1 plan: \`docs/superpowers/plans/2026-05-19-nthing-phase1-foundation.md\`
- 디자인 brief: \`docs/design/claude-design-brief.md\`
\`\`\`

- [ ] **Step 2: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/README.md
git commit -m "$(cat <<'EOF'
docs(mobile): add README with stack/setup/scripts/env documentation

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 17: 최종 검증 — lint + test + build + cap sync

**Files:** 없음 (검증만)

- [ ] **Step 1: lint**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm lint
```

Expected: 에러 없음.

- [ ] **Step 2: format check**

Run: `pnpm format:check`. Expected: 모든 파일 포맷 일치.

- [ ] **Step 3: test**

Run: `pnpm test:run`. Expected: Hello 테스트 1 passed.

- [ ] **Step 4: build**

Run: `pnpm build`. Expected: dist/ 생성, 에러 없음.

- [ ] **Step 5: cap sync 양 플랫폼**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
npx cap sync ios
npx cap sync android
```

Expected: 둘 다 성공.

- [ ] **Step 6: 결과 보고**

이 task는 commit하지 않음 — 모든 검증이 통과했음을 사용자에게 보고하고 Phase 1.1 완료.

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git log --oneline mobile-kmp...HEAD | head -30
```

기대 사항:
- Phase 1.1 commits 17개 정도 (Task 별로 1개씩)
- mobile/ 디렉토리에 Vite + Capacitor 셸 + Tailwind + 디자인 토큰 + 라우트 placeholder가 작동
- `pnpm dev` 시 브라우저에서 Nthing 워드마크 + 반띵 카피 + brand color 시각 확인 가능
- Android Studio / Xcode에서 셸 열림 (실제 디바이스 빌드는 다음 plan에서 OAuth/카카오맵 통합 후)

---

## Phase 1.1 완료 후 다음 단계 (다음 plan 후보)

- **Phase 1.2 — Design System Components**
  - Button (Primary/Secondary/Text), Card, Badge (StatusBadge), TextField, AppBar, BottomNav, FAB
  - Storybook 또는 routes/Catalog.tsx 같은 컴포넌트 카탈로그
  - 각 컴포넌트 단위 테스트

- **Phase 1.3 — API + Auth + OAuth**
  - shared/api/nthingApi.ts (fetch 인터셉터 + 토큰 자동 주입)
  - Zustand authStore (token 저장: Capacitor Preferences plugin)
  - LoginScreen (4 OAuth 소셜 버튼)
  - OAuth 웹 redirect flow (Capacitor Browser plugin) + nthing:// deep link callback
  - 자동 로그인 (Preferences 토큰 hydrate)

- **Phase 1.4 — Main Shell + Screens**
  - MainLayout (AppBar + BottomNav + FAB)
  - HomeTab (피드 + 필터 칩), MapTab (placeholder), ProfileTab (Guest/Logged 분기)
  - CreateSplitScreen (폼만 — 카메라/GPS는 다음)
  - SplitDetailScreen, SplitListScreen (mine/participated)

- **Phase 1.5 — 네이티브 통합 (카카오맵 + Camera + Geolocation + S3)**
  - Capacitor Camera plugin → 이미지 압축 + signUpload → S3 PUT
  - Capacitor Geolocation plugin → 등록 시 위치 캡처
  - 카카오맵 JS SDK 통합 (MapTab + 핀 + 슬라이드업 카드)
  - 실기기 스모크 (iOS + Android)
