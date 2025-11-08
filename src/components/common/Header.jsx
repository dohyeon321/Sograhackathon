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
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img
                src="/logo1.png"
                alt="찐대충인 로고"
                className="w-24 h-35 object-contain"
                onError={(e) => { e.target.style.display = 'none' }}
              />
              <h1
                className="text-4xl font-bold"
                style={{ fontFamily: 'Jua, sans-serif', color: '#000000' }}
              >
                찐대충인
              </h1>

            </div>


            <div className="flex items-center gap-3">
              {currentUser ? (
                // 로그인된 상태
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => {
                      if (onProfileClick) onProfileClick()
                      else setShowUserMenu(!showUserMenu)
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-semibold">
                      {userData?.displayName?.[0] ||
                        currentUser?.displayName?.[0] ||
                        currentUser?.email?.[0]?.toUpperCase() ||
                        '유'}
                    </div>


                    {/* 이름 + 로컬 뱃지 */}
                    <div className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-700">
                      <span>
                        {userData?.displayName ||
                          currentUser?.displayName ||
                          currentUser?.email?.split('@')[0] ||
                          '사용자'}
                      </span>
                      {isLocal && (
                        <span className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm">
                          🏡 <span className="hidden sm:inline">로컬</span>
                        </span>
                      )}
                    </div>

                    <svg
                      className="w-4 h-4 text-gray-400"
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

                  {/* 사용자 메뉴 드롭다운 */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-800">
                            {userData?.displayName || '사용자'}
                          </p>
                          {isLocal && (
                            <span className="bg-yellow-400 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                              로컬
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {userData?.email || currentUser?.email}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {userData?.region || '지역 미설정'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          if (onProfileClick) onProfileClick()
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                      >
                        내 정보
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // 로그인 안 된 상태
                <button
                  onClick={onLoginClick}
                  className="px-5 py-2.5 text-base font-medium text-gray-700 hover:text-blue-500 transition"
                >
                  로그인
                </button>
              )}

              {/* 글쓰기 버튼 */}
              <button
                onClick={handleWriteClick}
                className="px-5 py-2.5 rounded-lg text-base font-medium text-white 
             bg-gray-900 hover:bg-gray-700
             shadow-sm hover:shadow-md active:scale-[0.98]
             transition-all duration-300"
              >
                글쓰기
              </button>

            </div>
          </div>
        </div>
      </header>
    </>
  )
}

export default Header
