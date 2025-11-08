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

function BoardView({ selectedCategory, refreshTrigger }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 대전 충청 지역 필터링 함수
  const isDaejeonChungcheong = (location) => {
    if (!location) return false
    const locationLower = location.toLowerCase()
    const keywords = ['대전', '충청', '충남', '충북', '세종', '천안', '아산', '당진', '서산', '태안', '보령', '공주', '논산', '계룡', '금산', '부여', '서천', '청양', '홍성', '예산', '청주', '충주', '제천', '보은', '옥천', '영동', '증평', '진천', '괴산', '음성', '단양', '대전광역시', '충청남도', '충청북도', '세종특별자치시']
    return keywords.some(keyword => locationLower.includes(keyword))
  }

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
      
      const allPostsData = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          author: data.authorName || data.author || '익명',
          emoji: CATEGORY_EMOJI[data.category] || '📝',
          timeAgo: formatTimeAgo(data.createdAt),
          excerpt: data.content?.substring(0, 100) + '...' || '',
          isLocal: true
        }
      })
      
      console.log('전체 게시물 수:', allPostsData.length)
      console.log('게시물 목록:', allPostsData.map(p => ({ id: p.id, title: p.title, location: p.location, authorRegion: p.authorRegion })))
      
      // 대전 충청 지역 필터링
      // authorRegion이 대전/충청이면 무조건 통과, 아니면 location 확인
      const filteredPostsData = allPostsData.filter(post => {
        // authorRegion이 대전/충청이면 무조건 통과
        if (post.authorRegion && isDaejeonChungcheong(post.authorRegion)) {
          return true
        }
        // location에 대전/충청 키워드가 있으면 통과
        const matches = isDaejeonChungcheong(post.location)
        if (!matches) {
          console.log('필터링 제외된 게시물:', { 
            id: post.id, 
            title: post.title, 
            location: post.location, 
            authorRegion: post.authorRegion 
          })
        }
        return matches
      })
      
      // 임시: 필터링 비활성화 (테스트용)
      // const filteredPostsData = allPostsData
      
      console.log('필터링 후 게시물 수:', filteredPostsData.length)
      
      setPosts(filteredPostsData)
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">게시물을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  if (filteredPosts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">게시물이 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}

export default BoardView

