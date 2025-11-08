import { useState } from 'react'
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

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(tab) // 탭 변경 시 페이지도 함께 변경
  }

  const handleWriteClick = () => {
    setCurrentPage('write')
  }

  const handleWriteSuccess = () => {
    // 게시물 작성 성공 시 데이터 다시 불러오기
    setRefreshTrigger(prev => prev + 1)
    setCurrentPage('board')
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
      <div className="min-h-screen bg-gray-50">
        {currentPage !== 'postDetail' && currentPage !== 'userProfile' && currentPage !== 'write' && (
          <>
            <Header 
              onWriteClick={handleWriteClick} 
              onProfileClick={handleProfileClick}
              onLoginClick={handleLoginClick}
            />
            <HotIssueBanner 
              onPostClick={handlePostClick}
              refreshTrigger={refreshTrigger}
            />
            <RegionNewsBanner />
            <TabNavigation activeTab={activeTab} setActiveTab={handleTabChange} />
          </>
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
          />
        )}
        {currentPage === 'userProfile' && (
          <UserProfilePage onBack={handleBack} />
        )}
        {currentPage === 'write' && (
          <WritePage 
            onClose={handleBack}
            onSuccess={handleWriteSuccess}
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

