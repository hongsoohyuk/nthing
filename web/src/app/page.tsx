import ThemeToggle from "./theme-toggle";

export default function Home() {
  return (
    <>
      {/* Nav */}
      <nav className="nav">
        <div className="container nav-inner">
          <a href="#" className="brand">
            <span className="brand-mark">N</span>
            <span>NThing</span>
          </a>
          <div className="nav-right">
            <ThemeToggle />
            <a href="#download" className="nav-cta">
              <span>앱 다운로드</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="hero-eyebrow">
              <span className="dot" />
              <span>위치 기반 소셜 커머스</span>
            </div>
            <h1>
              이거 <span className="accent">N띵</span>
              <br />할 사람!
            </h1>
            <p>
              벌크/묶음 상품을 근처 사람과 나눠 구매하세요.
              <br />
              필요한 만큼만, 합리적인 가격으로.
            </p>
            <div className="hero-ctas">
              <a href="#download" className="btn btn-primary">
                <span>시작하기</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a href="#how" className="btn btn-secondary">
                <span>어떻게 되나요?</span>
              </a>
            </div>
            <div className="hero-meta">
              <div className="hero-meta-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                <span>300m 거리</span>
              </div>
              <div className="hero-meta-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                <span>반값에 나눠갖기</span>
              </div>
              <div className="hero-meta-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M8 12l3 3 5-6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>2026 출시 예정</span>
              </div>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="phone-wrap">
            <div className="float-callout tl">
              <div className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8Z"
                    fill="currentColor"
                  />
                  <circle cx="12" cy="10" r="3" fill="var(--surface)" />
                </svg>
              </div>
              <span>300m 거리</span>
            </div>
            <div className="float-callout br">
              <div className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"
                    fill="currentColor"
                  />
                  <path
                    d="M10 18a2 2 0 0 0 4 0"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span>지금 매칭 됐어요</span>
            </div>
            <div className="phone">
              <div className="phone-screen">
                <div className="phone-h">
                  <div>
                    <span className="phone-h-title">근처 N띵</span>
                    <span className="phone-h-chip">역삼동 ▾</span>
                  </div>
                </div>
                <div className="phone-chips">
                  <span className="phone-chip on">전체</span>
                  <span className="phone-chip">모집중</span>
                  <span className="phone-chip">음식</span>
                  <span className="phone-chip">생필품</span>
                </div>
                <div className="pcard">
                  <div className="pcard-img green">product shot</div>
                  <div className="pcard-body">
                    <div className="pcard-row1">
                      <span className="pcard-title">두쫀쿠 4개입</span>
                      <span className="badge">모집중</span>
                    </div>
                    <div className="pcard-meta">역삼동 GS25 · 300m · 5분 전</div>
                    <div className="pcard-row3">
                      <span className="pcard-price">1인당 ₩10,000</span>
                      <span className="pcard-recruit">2명 모집</span>
                    </div>
                  </div>
                </div>
                <div className="pcard">
                  <div className="pcard-img">bulk pack</div>
                  <div className="pcard-body">
                    <div className="pcard-row1">
                      <span className="pcard-title">유기농 달걀 30구</span>
                      <span className="badge">모집중</span>
                    </div>
                    <div className="pcard-meta">서초동 · 1.2km · 12분 전</div>
                    <div className="pcard-row3">
                      <span className="pcard-price">1인당 ₩6,500</span>
                      <span className="pcard-recruit">3명 모집</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="phone-nav">
                <div className="pn-item on">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 11 L12 4 L20 11 V20 a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>홈</span>
                </div>
                <div className="pn-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20 Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path d="M9 4 V18 M15 6 V20" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <span>지도</span>
                </div>
                <div className="pn-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                    <path
                      d="M4 20c0-4 4-6 8-6s8 2 8 6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>나</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section how" id="how">
        <div className="container">
          <div className="section-head">
            <div className="section-eyebrow">How it works</div>
            <h2>4단계로 끝</h2>
            <p className="section-sub">
              매장에서 발견, 앱에서 등록, 근처에서 매칭, 만나서 교환.
            </p>
          </div>
          <div className="how-grid">
            {[
              {
                num: "01",
                title: "발견",
                desc: "매장에서 두쫀쿠 4개입(2만원)을 발견. 근데 2개만 원해...",
                icon: (
                  <>
                    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                    <path
                      d="M16 16 L21 21"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </>
                ),
              },
              {
                num: "02",
                title: "등록",
                desc: "앱에서 상품 등록. 위치, 사진, 가격, 나눌 수량을 입력해요.",
                icon: (
                  <>
                    <rect
                      x="6"
                      y="3"
                      width="12"
                      height="18"
                      rx="2.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M11 18h2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </>
                ),
              },
              {
                num: "03",
                title: "매칭",
                desc: '근처 유저에게 알림! "300m 거리에서 두쫀쿠 N띵해요"',
                icon: (
                  <>
                    <path
                      d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 18a2 2 0 0 0 4 0"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </>
                ),
              },
              {
                num: "04",
                title: "완료",
                desc: "만나서 상품과 금액을 교환. 둘 다 반값에 GET!",
                icon: (
                  <>
                    <path
                      d="M8 12l3 3 5-6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                  </>
                ),
              },
            ].map((s) => (
              <div className="step" key={s.num}>
                <div className="step-num">{s.num}</div>
                <div className="step-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    {s.icon}
                  </svg>
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <div className="step-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why NThing */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="section-eyebrow">Why NThing</div>
            <h2>왜 NThing인가요?</h2>
            <p className="section-sub">
              동네에서, 실시간으로, 안전하게. 합리적인 소비의 3가지 약속.
            </p>
          </div>
          <div className="why-grid">
            <div className="feature">
              <div className="feature-visual">
                <div className="vis-map">
                  <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice">
                    <rect width="300" height="200" fill="transparent" />
                    <path d="M-20 70 L320 60" className="road" strokeWidth="14" />
                    <path d="M-20 130 L320 140" className="road" strokeWidth="10" />
                    <path d="M90 -10 L100 220" className="road" strokeWidth="14" />
                    <path d="M210 -10 L220 220" className="road" strokeWidth="10" />
                    <circle
                      cx="150"
                      cy="100"
                      r="60"
                      fill="rgba(22,163,74,0.14)"
                      stroke="rgba(22,163,74,0.45)"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                  </svg>
                  <div className="pin" style={{ left: "38%", top: "35%" }}>
                    A
                  </div>
                  <div className="pin" style={{ left: "58%", top: "62%" }}>
                    B
                  </div>
                </div>
              </div>
              <h3>위치 기반 매칭</h3>
              <p>
                GPS로 내 주변의 N띵을 실시간으로 찾아요. 걸어갈 수 있는 거리에서 바로
                거래할 수 있어요.
              </p>
              <div className="feature-tags">
                <span className="tag">반경 3km 이내</span>
                <span className="tag">실시간 거리 표시</span>
              </div>
            </div>

            <div className="feature">
              <div className="feature-visual">
                <div className="vis-notif">
                  <div className="notif-card">
                    <div className="ic">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"
                          fill="#fff"
                        />
                      </svg>
                    </div>
                    <div className="body">
                      <div className="meta">지금 · 300m</div>
                      <div className="title">&ldquo;두쫀쿠 반씩 N띵해요&rdquo;</div>
                    </div>
                  </div>
                  <div className="notif-card" style={{ opacity: 0.6 }}>
                    <div className="ic" style={{ background: "rgba(255,255,255,0.15)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"
                          fill="#fff"
                        />
                      </svg>
                    </div>
                    <div className="body">
                      <div className="meta">5분 전 · 1.2km</div>
                      <div className="title">&ldquo;달걀 30구 N띵해요&rdquo;</div>
                    </div>
                  </div>
                </div>
              </div>
              <h3>실시간 알림</h3>
              <p>
                근처에서 누군가 N띵을 등록하면 바로 푸시 알림이 와요. 놓치지 않고
                참여할 수 있어요.
              </p>
              <div className="feature-tags">
                <span className="tag">푸시 알림</span>
                <span className="tag">관심 카테고리</span>
              </div>
            </div>

            <div className="feature">
              <div className="feature-visual">
                <div className="vis-safe">
                  <div className="vis-safe-card">
                    {["프로필 인증", "거래 이력 공개", "신고 시스템"].map((label) => (
                      <div className="vis-safe-row" key={label}>
                        <span className="check">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M5 12l4 4 10-12"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <h3>안전 거래</h3>
              <p>
                프로필 인증과 거래 이력으로 신뢰할 수 있는 거래 환경을 제공해요. 안심하고
                N띵하세요.
              </p>
              <div className="feature-tags">
                <span className="tag">본인 인증</span>
                <span className="tag">평점 시스템</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Savings */}
      <section className="section savings">
        <div className="container">
          <div className="section-head">
            <div className="section-eyebrow">Savings</div>
            <h2>이만큼 절약돼요</h2>
            <p className="section-sub">
              실제 NThing 이용 시나리오. 큰 묶음을 나누면 가격은 절반 이하로.
            </p>
          </div>
          <div className="save-grid">
            {[
              {
                title: "코스트코 크루아상 12개",
                people: 2,
                old: "16,900원",
                next: "8,450원",
              },
              {
                title: "대용량 세탁 세제 5L",
                people: 3,
                old: "24,000원",
                next: "8,000원",
              },
              {
                title: "견과류 선물세트",
                people: 2,
                old: "35,000원",
                next: "17,500원",
              },
            ].map((s) => (
              <div className="save-card" key={s.title}>
                <div className="save-head">
                  <div className="save-thumb">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" />
                      <path
                        d="M3 17 L9 12 L13 15 L17 11 L21 14"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="save-title">{s.title}</div>
                    <div className="save-label" style={{ marginTop: 2 }}>
                      {s.people}명이서 나누면
                    </div>
                  </div>
                </div>
                <div className="save-row">
                  <span className="save-label">원래 가격</span>
                  <span className="save-old">{s.old}</span>
                </div>
                <div className="save-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 5v14M5 12l7 7 7-7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="save-row">
                  <span className="save-label">1인당</span>
                  <span className="save-new">{s.next}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download */}
      <section className="section" id="download" style={{ padding: "64px 0" }}>
        <div className="download">
          <div className="download-inner">
            <h2>지금 바로 시작하세요</h2>
            <p>필요한 만큼만 사는 똑똑한 소비, NThing과 함께</p>
            <div className="stores">
              <a className="store" href="#">
                <span className="ic">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
                    <path d="M16.5 1c.1 1.4-.5 2.7-1.3 3.6-.9 1-2.3 1.7-3.6 1.6-.2-1.3.5-2.7 1.3-3.6.9-1 2.4-1.7 3.6-1.6Zm4 17c-.6 1.4-1 2-1.7 3.2-1 1.6-2.5 3.6-4.4 3.7-1.7 0-2.1-1.1-4.4-1.1-2.3 0-2.8 1.1-4.4 1.1-1.9-.1-3.3-2-4.3-3.6C.7 18.7-.2 14.5 1.5 11.5c1.2-2 3.1-3.3 4.9-3.3 1.7 0 2.7 1.1 4.1 1.1 1.4 0 2.2-1.1 4.2-1.1 1.5 0 3 .8 4.1 2.2-3.6 2-3 7.2 1.7 7.6Z" />
                  </svg>
                </span>
                <span className="store-meta">
                  <span className="small">Coming Soon</span>
                  <span className="big">App Store</span>
                </span>
              </a>
              <a className="store" href="#">
                <span className="ic">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3.6 2.3l11 9.7-11 9.7c-.4-.3-.6-.7-.6-1.3V3.6c0-.6.2-1 .6-1.3Z"
                      fill="#34A853"
                    />
                    <path
                      d="M14.6 12l3.6-3.2 2.6 1.5c1.1.6 1.1 1.8 0 2.4l-2.6 1.5L14.6 12Z"
                      fill="#FBBC04"
                    />
                    <path d="M3.6 2.3 14.6 12 11.3 14.9 3.6 2.3Z" fill="#EA4335" />
                    <path d="M3.6 21.7 11.3 9.1 14.6 12 3.6 21.7Z" fill="#4285F4" />
                  </svg>
                </span>
                <span className="store-meta">
                  <span className="small">Coming Soon</span>
                  <span className="big">Google Play</span>
                </span>
              </a>
            </div>
            <div className="download-note">2026년 상반기 출시 예정</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <span className="footer-brand-mark">N</span>
              <span className="name">NThing</span>
              <span className="sub">엔띵</span>
            </div>
            <div className="footer-links">
              <a href="/privacy">개인정보처리방침</a>
              <a href="/terms">이용약관</a>
              <a href="mailto:hello@nthing.app">문의하기</a>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copy">© 2026 NThing. All rights reserved.</div>
            <div className="footer-copy">이거 N띵 할 사람!</div>
          </div>
        </div>
      </footer>
    </>
  );
}
