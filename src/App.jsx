import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/common/Header'
import HotIssueBanner from './components/common/HotIssueBanner'
import RegionNewsBanner from './components/common/RegionNewsBanner'
import TabNavigation from './components/common/TabNavigation'
import BoardPage from './pages/board/BoardPage'
import MapPage from './pages/map/MapPage'
import DaejeonChungcheongPage from './pages/spot/DaejeonChungcheongPage'
import AttractionDetailPage from './pages/spot/AttractionDetailPage'
import PostDetailPage from './pages/post/PostDetailPage'
import UserProfilePage from './pages/user/UserProfilePage'
import WritePage from './pages/write/WritePage'
import AuthPage from './pages/auth/AuthPage'
function App() {
  const [activeTab, setActiveTab] = useState('board')
  const [currentPage, setCurrentPage] = useState('board') // board, map, daejeonChungcheong, attractionDetail, postDetail, userProfile, write, auth
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [selectedAttraction, setSelectedAttraction] = useState(null) // { region, id }
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('login') // 'login' or 'signup' or 'signupCompleted'
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [previousPage, setPreviousPage] = useState('board')
  const [editPostId, setEditPostId] = useState(null)
  const [editPostData, setEditPostData] = useState(null)
  const tabNavigationRef = useRef(null)

  // 지도 페이지 전환 시 자동 스크롤
  useEffect(() => {
    if (currentPage === 'map' && tabNavigationRef.current) {
      setTimeout(() => {
        const tabNav = tabNavigationRef.current
        if (tabNav) {
          window.scrollTo({ top: tabNav.offsetTop + tabNav.offsetHeight, behavior: 'smooth' })
        }
      }, 100)
    }
  }, [currentPage])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(tab)
  }

  const handleWriteClick = () => setCurrentPage('write')
  const handleProfileClick = () => setCurrentPage('userProfile')
  const handleLoginClick = () => {
    setAuthMode('login')
    setShowAuthModal(true)
  }
  const handleAuthClose = () => {
    setShowAuthModal(false)
    setAuthMode('login')
  }
  
  // 이메일 인증 완료 후 회원가입 완료 화면 표시
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('mode') === 'verifyEmail' && urlParams.get('oobCode')) {
      setAuthMode('signupCompleted')
      setShowAuthModal(true)
      // URL 파라미터 제거
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handleWriteSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
    setEditPostId(null)
    setEditPostData(null)
    setCurrentPage('board')
  }

  const handleEditPost = (postId, postData) => {
    setEditPostId(postId)
    setEditPostData(postData)
    setPreviousPage(currentPage)
    setCurrentPage('write')
  }

  const handlePostClick = (postId) => {
    setPreviousPage(currentPage)
    setSelectedPostId(postId)
    setCurrentPage('postDetail')
  }

  const handleBack = () => {
    // 이전 페이지로 돌아가기 (지도에서 왔다면 지도로, 게시판에서 왔다면 게시판으로)
    // 명소 상세 페이지에서 돌아올 때는 목록 페이지 새로고침
    if (currentPage === 'attractionDetail' && previousPage === 'daejeonChungcheong') {
      setRefreshTrigger(prev => prev + 1)
    }
    setCurrentPage(previousPage)
    setSelectedPostId(null)
    setSelectedAttraction(null)
  }

  const handleAttractionClick = (region, attractionId) => {
    setPreviousPage(currentPage)
    setSelectedAttraction({ region, id: attractionId })
    setCurrentPage('attractionDetail')
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 text-gray-800">
        {currentPage !== 'postDetail' && currentPage !== 'userProfile' && currentPage !== 'write' && currentPage !== 'attractionDetail' && (
          <>
            <Header
              onWriteClick={handleWriteClick}
              onProfileClick={handleProfileClick}
              onLoginClick={handleLoginClick}
            />

            {/* 🌆 메인 히어로 섹션 */}
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="relative w-full text-white overflow-hidden"
            >
              <img
                src="/img/daejeon.jpg"
                alt="대전 충청 지역 전경"
                className="absolute inset-0 w-full h-[80vh] object-cover brightness-[0.45]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="relative z-10 flex flex-col items-center justify-center text-center h-[80vh] px-6">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-5xl md:text-6xl font-extrabold mb-6 drop-shadow-2xl tracking-tight"
                  style={{ fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif" }}
                >
                  대전·충청에 오신 것을 환영합니다!
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="text-lg md:text-2xl text-white/90 max-w-2xl leading-relaxed"
                  style={{ fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif" }}
                >
                  따뜻한 사람들, 맛있는 음식, 그리고 숨은 명소들을 만나보세요 🌿
                </motion.p>
              </div>
            </motion.section>

            {/* 🔥 핫이슈 섹션 */}
            <HotIssueBanner onPostClick={handlePostClick} refreshTrigger={refreshTrigger} />

            {/* 📰 지역 뉴스 */}
            <RegionNewsBanner />

            {/* 🧭 탭 네비게이션 */}
            <div ref={tabNavigationRef}>
              <TabNavigation activeTab={activeTab} setActiveTab={handleTabChange} />
            </div>
          </>
        )}

        {/* 📄 페이지 컨텐츠 */}
        {currentPage === 'board' && (
          <BoardPage
            refreshTrigger={refreshTrigger}
            onWriteClick={handleWriteClick}
            onPostClick={handlePostClick}
          />
        )}
        {currentPage === 'map' && <MapPage onPostClick={handlePostClick} />}
        {currentPage === 'daejeonChungcheong' && (
          <DaejeonChungcheongPage 
            onAttractionClick={handleAttractionClick}
            refreshTrigger={refreshTrigger}
          />
        )}
        {currentPage === 'attractionDetail' && selectedAttraction && (
          <AttractionDetailPage
            region={selectedAttraction.region}
            attractionId={selectedAttraction.id}
            onBack={handleBack}
            onPhotoUploaded={() => {
              // 사진 업로드 시 목록 페이지 새로고침
              setRefreshTrigger(prev => prev + 1)
            }}
          />
        )}
        {currentPage === 'postDetail' && (
          <PostDetailPage postId={selectedPostId} onBack={handleBack} onEditPost={handleEditPost} />
        )}
        {currentPage === 'userProfile' && (
          <UserProfilePage onBack={handleBack} onEditPost={handleEditPost} onPostClick={handlePostClick} />
        )}
        {currentPage === 'write' && (
          <WritePage
            onClose={() => {
              setEditPostId(null)
              setEditPostData(null)
              handleBack()
            }}
            onSuccess={handleWriteSuccess}
            editPostId={editPostId}
            editPostData={editPostData}
          />
        )}
        <AuthPage 
          isOpen={showAuthModal} 
          onClose={handleAuthClose} 
          initialMode={authMode}
        />
      </div>
    </AuthProvider>
  )
}

export default App
