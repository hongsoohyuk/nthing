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
