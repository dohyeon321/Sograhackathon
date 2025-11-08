import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'

function Header({ onWriteClick, onProfileClick, onLoginClick }) {
  const { currentUser, userData, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef(null)

  // 대전/충청 지역 확인 함수
  const isDaejeonChungcheong = (region) => {
    if (!region) return false
    const regionLower = region.toLowerCase()
    const keywords = ['대전', '충청', '충남', '충북', '세종', '대전광역시', '충청남도', '충청북도', '세종특별자치시']
    return keywords.some(keyword => regionLower.includes(keyword))
  }

  const isLocal = isDaejeonChungcheong(userData?.region)

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleLogout = async () => {
    await logout()
    setShowUserMenu(false)
  }

  const handleWriteClick = () => {
    if (!currentUser) {
      if (onLoginClick) onLoginClick()
      return
    }
    if (onWriteClick) onWriteClick()
  }

  return (
    <header className="relative z-30 pt-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between rounded-3xl border border-white/40 bg-white/80 px-6 py-5 shadow-[0_18px_45px_-25px_rgba(30,64,175,0.6)] backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg">
                <img
                  src="/logo1.png"
                  alt="찐대충인 로고"
                  className="h-14 w-14 object-contain drop-shadow-lg"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                  찐대충인
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  대전 · 충청 생활의 모든 순간을 담는 로컬 라이프 플랫폼
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <nav className="hidden lg:flex items-center gap-3 rounded-full border border-blue-100 bg-blue-50/60 px-4 py-1.5 text-sm font-medium text-blue-700 shadow-inner">
                <span className="px-3 py-1 rounded-full bg-white text-blue-600 shadow-sm">로컬 스토리</span>
                <span className="px-3 py-1 rounded-full hover:bg-white hover:text-blue-600 transition">탐방지도</span>
                <span className="px-3 py-1 rounded-full hover:bg-white hover:text-blue-600 transition">축제·이벤트</span>
              </nav>

              {currentUser ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => {
                      if (onProfileClick) onProfileClick()
                      else setShowUserMenu(!showUserMenu)
                    }}
                    className="group flex items-center gap-3 rounded-full border border-blue-100 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white text-base font-semibold">
                      {userData?.displayName?.[0] ||
                        currentUser?.displayName?.[0] ||
                        currentUser?.email?.[0]?.toUpperCase() ||
                        '유'}
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <span>
                        {userData?.displayName ||
                          currentUser?.displayName ||
                          currentUser?.email?.split('@')[0] ||
                          '사용자'}
                      </span>
                      {isLocal && (
                        <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                          🏡 <span className="hidden sm:inline">로컬</span>
                        </span>
                      )}
                    </div>
                    <svg
                      className="h-4 w-4 text-slate-400 transition group-hover:text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-slate-100 bg-white/95 shadow-[0_18px_45px_-25px_rgba(15,23,42,0.45)] backdrop-blur">
                      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                        <div className="mb-1 flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800">
                            {userData?.displayName || '사용자'}
                          </p>
                          {isLocal && (
                            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-white">
                              로컬
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {userData?.email || currentUser?.email}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          📍 {userData?.region || '지역 미설정'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          if (onProfileClick) onProfileClick()
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-blue-50"
                      >
                        내 정보
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-500"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onLoginClick}
                  className="rounded-full border border-white/60 bg-white/70 px-5 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
                >
                  로그인
                </button>
              )}

              <button
                onClick={handleWriteClick}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(37,99,235,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_-20px_rgba(37,99,235,0.75)]"
              >
                <span className="text-lg">✍️</span>
                글쓰기
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-between rounded-3xl border border-white/40 bg-white/60 px-6 py-4 shadow-[0_12px_35px_-25px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <p className="text-lg font-semibold text-slate-700">
              대전과 충청을 누비는 사람들의 살아있는 이야기, 지금 바로 만나보세요.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-600">
                <span className="text-base">📍</span> Local Insight
              </span>
              <span className="hidden lg:inline-block">|</span>
              <span className="hidden lg:inline-block">Festival · 커뮤니티 · 라이프스타일</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
