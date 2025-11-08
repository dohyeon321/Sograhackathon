function TabNavigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'board', label: '커뮤니티 게시판', description: '로컬들의 생생한 이야기' },
    { id: 'map', label: '탐방 지도', description: '핫플 위치와 리뷰 한눈에' }
  ]

  return (
    <nav className="relative z-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/80 px-4 py-4 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.4em] text-blue-500">
              Local Insight
              <span className="hidden rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600 sm:inline-block">
                Explore
              </span>
            </div>
            <p className="text-sm text-slate-500">
              내가 원하는 정보를 선택해 탐험을 시작해보세요.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex flex-1 min-w-[160px] items-center justify-between gap-3 rounded-2xl border px-5 py-3 text-left transition-all ${
                  activeTab === tab.id
                    ? 'border-transparent bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_15px_35px_-20px_rgba(37,99,235,0.8)]'
                    : 'border-transparent bg-white/80 text-slate-600 shadow-inner hover:bg-white hover:text-blue-600'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold md:text-base">{tab.label}</p>
                  <p
                    className={`text-xs transition-colors ${
                      activeTab === tab.id ? 'text-white/80' : 'text-slate-400'
                    }`}
                  >
                    {tab.description}
                  </p>
                </div>
                <span
                  className={`text-lg transition-transform ${
                    activeTab === tab.id ? 'translate-x-1' : 'text-slate-300 group-hover:translate-x-1 group-hover:text-blue-400'
                  }`}
                >
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default TabNavigation

