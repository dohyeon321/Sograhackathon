import { useState, useEffect, useRef } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/common/Header'
import HotIssueBanner from './components/common/HotIssueBanner'
import RegionNewsBanner from './components/common/RegionNewsBanner'
import TabNavigation from './components/common/TabNavigation'
import BoardPage from './pages/board/BoardPage'
import MapPage from './pages/map/MapPage'
import PostDetailPage from './pages/post/PostDetailPage'
import UserProfilePage from './pages/user/UserProfilePage'
import WritePage from './pages/write/WritePage'
import AuthPage from './pages/auth/AuthPage'

function App() {
  const [activeTab, setActiveTab] = useState('board')
  const [currentPage, setCurrentPage] = useState('board') // board, map, postDetail, userProfile, write, auth
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [previousPage, setPreviousPage] = useState('board') // 이전 페이지 추적
  const [editPostId, setEditPostId] = useState(null) // 수정할 게시물 ID
  const [editPostData, setEditPostData] = useState(null) // 수정할 게시물 데이터
  const tabNavigationRef = useRef(null) // 탭 네비게이션 참조

  // 지도 페이지로 전환 시 탭 네비게이션 아래로 스크롤
  useEffect(() => {
    if (currentPage === 'map' && tabNavigationRef.current) {
      // 약간의 지연을 두어 DOM이 렌더링된 후 스크롤
      setTimeout(() => {
        const tabNavElement = tabNavigationRef.current
        if (tabNavElement) {
          const tabNavBottom = tabNavElement.offsetTop + tabNavElement.offsetHeight
          window.scrollTo({
            top: tabNavBottom,
            behavior: 'smooth'
          })
        }
      }, 100)
    }
  }, [currentPage])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(tab) // 탭 변경 시 페이지도 함께 변경
  }

  const handleWriteClick = () => {
    setCurrentPage('write')
  }

  const handleWriteSuccess = () => {
    // 게시물 작성/수정 성공 시 데이터 다시 불러오기
    setRefreshTrigger(prev => prev + 1)
    setEditPostId(null)
    setEditPostData(null)
    setCurrentPage('board')
  }
  
  const handleEditPost = (postId, postData) => {
    // 수정 페이지로 이동
    setEditPostId(postId)
    setEditPostData(postData)
    setPreviousPage(currentPage)
    setCurrentPage('write')
  }

  const handlePostClick = (postId) => {
    // 현재 페이지를 이전 페이지로 저장
    setPreviousPage(currentPage)
    setSelectedPostId(postId)
    setCurrentPage('postDetail')
  }

  const handleBack = () => {
    // 이전 페이지로 돌아가기 (지도에서 왔다면 지도로, 게시판에서 왔다면 게시판으로)
    setCurrentPage(previousPage)
    setSelectedPostId(null)
  }

  const handleProfileClick = () => {
    setCurrentPage('userProfile')
  }

  const handleLoginClick = () => {
    setShowAuthModal(true)
  }

  const handleAuthClose = () => {
    setShowAuthModal(false)
  }

  return (
    <AuthProvider>
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-[-20%] top-[-280px] h-[520px] bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700" />
          <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
          <div className="absolute -top-16 right-1/3 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />
          <div className="absolute top-72 left-12 h-56 w-56 rounded-full bg-indigo-200/30 blur-3xl" />
        </div>

        {currentPage !== 'postDetail' && currentPage !== 'userProfile' && currentPage !== 'write' && (
          <div className="relative z-10">
            <Header
              onWriteClick={handleWriteClick}
              onProfileClick={handleProfileClick}
              onLoginClick={handleLoginClick}
            />
            <div className="space-y-12 pb-16">
              <HotIssueBanner
                onPostClick={handlePostClick}
                refreshTrigger={refreshTrigger}
              />
              <RegionNewsBanner />
            </div>
            <div ref={tabNavigationRef} className="relative z-20">
              <TabNavigation activeTab={activeTab} setActiveTab={handleTabChange} />
            </div>
          </div>
        )}

        {currentPage === 'board' && (
          <BoardPage
            refreshTrigger={refreshTrigger}
            onWriteClick={handleWriteClick}
            onPostClick={handlePostClick}
          />
        )}
        {currentPage === 'map' && <MapPage onPostClick={handlePostClick} />}
        {currentPage === 'postDetail' && (
          <PostDetailPage 
            postId={selectedPostId} 
            onBack={handleBack}
            onEditPost={handleEditPost}
          />
        )}
        {currentPage === 'userProfile' && (
          <UserProfilePage 
            onBack={handleBack}
            onEditPost={handleEditPost}
            onPostClick={handlePostClick}
          />
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
        />
      </div>
    </AuthProvider>
  )
}

export default App

