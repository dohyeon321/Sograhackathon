import { useState, useEffect, useMemo } from 'react'
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore'
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
  const [commentCounts, setCommentCounts] = useState({}) // { postId: count }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 실제 댓글 개수 가져오기 (최적화: 배치 처리)
  const fetchCommentCounts = async (postIds) => {
    if (!db || postIds.length === 0) return {}
    
    const counts = {}
    const commentsRef = collection(db, 'comments')
    
    // 배치로 처리하여 성능 개선 (최대 10개씩)
    const batchSize = 10
    for (let i = 0; i < postIds.length; i += batchSize) {
      const batch = postIds.slice(i, i + batchSize)
      const promises = batch.map(async (postId) => {
        try {
          const q = query(commentsRef, where('postId', '==', postId))
          const snapshot = await getDocs(q)
          return { postId, count: snapshot.size }
        } catch (err) {
          if (import.meta.env.DEV) {
            console.warn(`댓글 개수 조회 실패 (${postId}):`, err)
          }
          return { postId, count: 0 }
        }
      })
      
      const results = await Promise.all(promises)
      results.forEach(({ postId, count }) => {
        counts[postId] = count
      })
    }
    
    return counts
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
      
      const postsData = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          author: data.authorName || data.author || '익명',
          emoji: CATEGORY_EMOJI[data.category] || '📝',
          timeAgo: formatTimeAgo(data.createdAt),
          excerpt: data.content?.substring(0, 100) + '...' || '',
          authorIsLocal: data.authorIsLocal === true // 작성자의 로컬 인증 여부
        }
      })
      
      if (import.meta.env.DEV) {
        console.log('전체 게시물 수:', postsData.length)
        console.log('로컬 인증 게시물 수:', postsData.filter(p => p.authorIsLocal === true).length)
      }
      
      setPosts(postsData)
      
      // 게시물 로드 후 댓글 개수 가져오기 (비동기로 처리하여 렉 방지)
      const postIds = postsData.map(p => p.id)
      fetchCommentCounts(postIds).then(counts => {
        setCommentCounts(counts)
      })
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('게시물 불러오기 에러:', err)
      }
      setError(`게시물을 불러오는 중 오류가 발생했습니다: ${err.message || '알 수 없는 오류'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  // 실제 댓글 개수가 포함된 게시물 목록
  const postsWithCommentCounts = useMemo(() => {
    return posts.map(post => ({
      ...post,
      comments: commentCounts[post.id] !== undefined ? commentCounts[post.id] : (post.comments || 0)
    }))
  }, [posts, commentCounts])

  const filteredPosts = selectedCategory === 'all' 
    ? postsWithCommentCounts 
    : selectedCategory === 'local'
    ? postsWithCommentCounts.filter(post => post.authorIsLocal === true)
    : postsWithCommentCounts.filter(post => post.category === selectedCategory)

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
          <PostCard key={post.id} post={post} onClick={onPostClick} />
        ))}
      </div>
    </div>
  )
}

export default BoardView

