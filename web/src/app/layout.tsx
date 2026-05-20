import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NThing — 이거 N띵 할 사람!",
  description:
    "이거 N띵 할 사람! 벌크/묶음 상품을 근처 사람과 나눠 구매하는 위치 기반 소셜 커머스.",
  openGraph: {
    title: "NThing — 이거 N띵 할 사람!",
    description: "벌크/묶음 상품을 근처 사람과 나눠 구매하세요.",
    type: "website",
  },
};

const themePrePaint = `(function(){try{var s=localStorage.getItem('nthing-theme');var t=s||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
        <script dangerouslySetInnerHTML={{ __html: themePrePaint }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
