import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  // 터치 기기에서 탭 후 hover: 스타일이 들러붙는 현상 방지.
  // hover 를 실제로 지원하는 기기(@media (hover: hover))에서만 hover: 유틸 적용.
  future: {
    hoverOnlyWhenSupported: true,
  },
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
