import { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/Header'
import TabNavigation from './components/TabNavigation'
import CategoryFilter from './components/CategoryFilter'
import FestivalBanner from './components/FestivalBanner'
import RecommendedKeywords from './components/RecommendedKeywords'
import BoardView from './components/BoardView'
import MapView from './components/MapView'
import WritePostModal from './components/WritePostModal'

function App() {
  const [activeTab, setActiveTab] = useState('board')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showWriteModal, setShowWriteModal] = useState(false)

  const handleWriteClick = () => {
    setShowWriteModal(true)
  }

  const handleWriteSuccess = () => {
    // 게시물 작성 성공 시 새로고침 또는 데이터 다시 불러오기
    window.location.reload()
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Header onWriteClick={handleWriteClick} />
        <FestivalBanner />
        <RecommendedKeywords />
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        {activeTab === 'board' && (
          <>
            <CategoryFilter 
              selectedCategory={selectedCategory} 
              setSelectedCategory={setSelectedCategory} 
            />
            <BoardView selectedCategory={selectedCategory} />
          </>
        )}
        {activeTab === 'map' && <MapView />}
        
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

