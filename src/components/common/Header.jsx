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
      if (onLoginClick) {
        onLoginClick()
      }
      return
    }
    if (onWriteClick) {
      onWriteClick()
    }
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="찐대충인 로고" 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  // 이미지가 없으면 숨김
                  e.target.style.display = 'none'
                }}
              />
              <h1 className="text-3xl font-bold text-gray-700">
                <span className="text-blue-500">찐대충인</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {currentUser ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => {
                      if (onProfileClick) {
                        onProfileClick()
                      } else {
                        setShowUserMenu(!showUserMenu)
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-base font-semibold">
                      {userData?.displayName?.[0] || currentUser.email?.[0]?.toUpperCase()}
                    </div>
                    <span className="hidden md:block text-base font-medium text-gray-700 flex items-center gap-2">
                      {userData?.displayName || '사용자'}
                      {isLocal && (
                        <span className="bg-yellow-400 text-white px-2 py-0.5 rounded text-xs font-semibold">
                          로컬
                        </span>
                      )}
                    </span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-800">{userData?.displayName}</p>
                          {isLocal && (
                            <span className="bg-yellow-400 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                              로컬
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{userData?.email || currentUser.email}</p>
                        <p className="text-xs text-gray-500 mt-1">📍 {userData?.region}</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          if (onProfileClick) {
                            onProfileClick()
                          }
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
                <button
                  onClick={() => {
                    if (onLoginClick) {
                      onLoginClick()
                    }
                  }}
                  className="px-5 py-2.5 text-base font-medium text-gray-700 hover:text-blue-500 transition"
                >
                  로그인
                </button>
              )}
              <button
                onClick={handleWriteClick}
                className="px-5 py-2.5 bg-blue-500 text-white rounded-lg text-base font-medium hover:bg-blue-600 transition"
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

