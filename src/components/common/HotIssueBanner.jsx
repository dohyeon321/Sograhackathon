import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'

const CATEGORY_EMOJI = {
  '맛집': '🍽️',
  '교통': '🚗',
  '핫플': '🎉',
  '꿀팁': '💡'
}

function HotIssueBanner({ onPostClick, refreshTrigger }) {
  const [hotPosts, setHotPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHotPosts = async () => {
      try {
        setLoading(true)
        
        if (!db) {
          setLoading(false)
          return
        }
        
        const postsRef = collection(db, 'posts')
        // 조회수 높은 순으로 정렬하여 상위 3개 가져오기
        const q = query(postsRef, orderBy('views', 'desc'), limit(3))
        const querySnapshot = await getDocs(q)
        
        const postsData = querySnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            emoji: CATEGORY_EMOJI[data.category] || '📝'
          }
        })
        
        setHotPosts(postsData)
      } catch (err) {
        console.error('핫이슈 게시물 불러오기 에러:', err)
        // 인덱스 에러인 경우 클라이언트에서 정렬
        try {
          const postsRef = collection(db, 'posts')
          const allPostsSnapshot = await getDocs(postsRef)
          
          const allPosts = allPostsSnapshot.docs.map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              emoji: CATEGORY_EMOJI[data.category] || '📝'
            }
          })
          
          // 클라이언트에서 조회수 높은 순으로 정렬
          const sortedPosts = allPosts
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 3)
          
          setHotPosts(sortedPosts)
        } catch (fallbackErr) {
          console.error('핫이슈 게시물 불러오기 실패:', fallbackErr)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchHotPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  if (loading || hotPosts.length === 0) {
    return null
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold">🔥 핫이슈</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {hotPosts.map((post, index) => (
              <div
                key={post.id}
                onClick={() => {
                  if (onPostClick) {
                    onPostClick(post.id)
                  }
                }}
                className="bg-white/20 backdrop-blur-sm rounded-lg p-3 cursor-pointer hover:bg-white/30 transition"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold bg-white/30 px-2 py-0.5 rounded">
                    {index + 1}위
                  </span>
                  <span className="text-lg">{post.emoji}</span>
                  <span className="text-xs text-white/90">{post.category}</span>
                </div>
                <h4 className="font-semibold text-sm mb-1 line-clamp-1">{post.title}</h4>
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <span>👁️ {post.views || 0}</span>
                  <span>❤️ {post.likes || 0}</span>
                  <span>💬 {post.comments || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HotIssueBanner

