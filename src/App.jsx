import { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/common/Header'
import TabNavigation from './components/common/TabNavigation'
import BoardPage from './pages/board/BoardPage'
import MapPage from './pages/map/MapPage'
import WritePostModal from './components/post/WritePostModal'

function App() {
  const [activeTab, setActiveTab] = useState('board')
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleWriteClick = () => {
    setShowWriteModal(true)
  }

  const handleWriteSuccess = () => {
    // 게시물 작성 성공 시 데이터 다시 불러오기
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Header onWriteClick={handleWriteClick} />
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        {activeTab === 'board' && (
          <BoardPage refreshTrigger={refreshTrigger} onWriteClick={handleWriteClick} />
        )}
        {activeTab === 'map' && <MapPage />}
        
        <WritePostModal 
          isOpen={showWriteModal} 
          onClose={() => setShowWriteModal(false)}
          onSuccess={handleWriteSuccess}
        />
      </div>
    </AuthProvider>
  )
}

export default App

