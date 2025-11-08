import { useState, useEffect } from 'react'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import PostCard from './PostCard'

const CATEGORY_EMOJI = {
  '맛집': '🍽️',
  '교통': '🚗',
  '핫플': '🎉',
  '꿀팁': '💡'
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return '방금 전'
  
  const now = new Date()
  const postTime = timestamp.toDate()
  const diffInSeconds = Math.floor((now - postTime) / 1000)
  
  if (diffInSeconds < 60) return '방금 전'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`
  return `${Math.floor(diffInSeconds / 604800)}주 전`
}

function BoardView({ selectedCategory, refreshTrigger, onPostClick }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!db) {
        console.warn('Firebase가 초기화되지 않았습니다.')
        setError('Firebase가 초기화되지 않았습니다. 페이지를 새로고침해주세요.')
        setLoading(false)
        return
      }
      
      const postsRef = collection(db, 'posts')
      const q = query(postsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const postsData = querySnapshot.docs.map(doc => {
        const data = doc.data()
        const content = data.content || ''
        return {
          id: doc.id,
          ...data,
          author: data.authorName || data.author || '익명',
          emoji: CATEGORY_EMOJI[data.category] || '📝',
          timeAgo: formatTimeAgo(data.createdAt),
          excerpt: content ? (content.length > 100 ? `${content.slice(0, 100)}...` : content) : '',
          isLocal: true
        }
      })

      setPosts(postsData)
    } catch (err) {
      console.error('게시물 불러오기 에러:', err)
      setError(`게시물을 불러오는 중 오류가 발생했습니다: ${err.message || '알 수 없는 오류'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory)

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-slate-500">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500"></div>
          <p className="text-sm font-medium">지역 소식을 불러오는 중입니다...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="py-16 text-center">
          <p className="text-sm font-semibold text-red-500">{error}</p>
        </div>
      )
    }

    if (filteredPosts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
          <span className="text-4xl">🔎</span>
          <p className="text-sm font-medium">아직 등록된 게시물이 없습니다. 첫 번째 이야기를 남겨보세요!</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.map((post) => (
          <PostCard key={post.id} post={post} onClick={onPostClick} />
        ))}
      </div>
    )
  }

  return (
    <section className="px-6 pb-16">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[36px] border border-white/65 bg-white/80 px-6 py-8 shadow-[0_35px_70px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">로컬 커뮤니티 게시판</h3>
              <p className="mt-1 text-sm text-slate-500">
                실시간으로 업데이트되는 대전 · 충청 로컬 스토리를 확인해보세요.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
              <span className="text-xs uppercase tracking-[0.35em] text-slate-400">Post</span>
              <span>{filteredPosts.length}</span>
            </div>
          </div>

          {renderContent()}
        </div>
      </div>
    </section>
  )
}

export default BoardView

