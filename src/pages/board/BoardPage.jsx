import { useState } from 'react'
import BoardView from './components/BoardView'
import CategoryFilter from './components/CategoryFilter'

function BoardPage({ refreshTrigger, onWriteClick, onPostClick }) {
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <>
      <CategoryFilter 
        selectedCategory={selectedCategory} 
        setSelectedCategory={setSelectedCategory} 
      />
      <BoardView 
        selectedCategory={selectedCategory} 
        refreshTrigger={refreshTrigger}
        onPostClick={onPostClick}
      />
    </>
  )
}

export default BoardPage

