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
          const content = data.content || ''
          return {
            id: doc.id,
            ...data,
            emoji: CATEGORY_EMOJI[data.category] || '📝',
            excerpt: content.length > 90 ? `${content.slice(0, 90)}...` : content
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
            const content = data.content || ''
            return {
              id: doc.id,
              ...data,
              emoji: CATEGORY_EMOJI[data.category] || '📝',
              excerpt: content.length > 90 ? `${content.slice(0, 90)}...` : content
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
    <section className="px-6">
      <div className="mx-auto max-w-7xl">
        <div
          className="relative overflow-hidden rounded-[34px] border border-white/40 bg-gradient-to-br from-blue-500/95 via-sky-500/90 to-indigo-500/90 shadow-[0_35px_65px_-45px_rgba(15,23,42,0.8)]"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(37, 99, 235, 0.88), rgba(14, 116, 144, 0.68)), url('https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1600&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-sky-900/40 via-blue-900/20 to-sky-800/30" />
          <div className="relative z-10 px-8 py-10 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-white/60">Hot Topic</p>
                <h2 className="mt-2 text-3xl font-bold md:text-4xl">
                  대전 · 충청 지역에서 지금 가장 뜨거운 이야기
                </h2>
                <p className="mt-3 max-w-2xl text-base text-white/80">
                  현지인들이 주목한 로컬 뉴스와 이야기를 한눈에 살펴보세요. 인기 있는 소식일수록 더 많은 혜택과 정보를 빠르게 받아볼 수 있어요.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-full border border-white/40 bg-white/15 px-4 py-2 text-sm text-white/90 backdrop-blur">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xl">🔥</span>
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/70">Weekly Ranking</p>
                  <p className="text-sm font-semibold">실시간 인기 Top 3</p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {hotPosts.map((post, index) => (
                <button
                  key={post.id}
                  onClick={() => onPostClick && onPostClick(post.id)}
                  className="group flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/30 bg-white/20 p-5 text-left transition hover:-translate-y-1 hover:bg-white/30"
                >
                  <div>
                    <div className="flex items-center gap-3 text-sm font-semibold text-white/90">
                      <span className="flex items-center gap-1 rounded-full bg-white/30 px-3 py-1 text-xs font-semibold text-white">
                        TOP {index + 1}
                      </span>
                      <span className="text-lg">{post.emoji}</span>
                      <span className="text-xs uppercase tracking-wide text-white/70">{post.category}</span>
                    </div>
                    <h3 className="mt-4 line-clamp-2 text-lg font-bold leading-snug text-white">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm text-white/80">
                      {post.excerpt || '지금 지역민들이 가장 많이 찾는 정보를 확인해보세요.'}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between text-xs text-white/80">
                    <span className="flex items-center gap-1">👁️ {post.views || 0}</span>
                    <span className="flex items-center gap-1">❤️ {post.likes || 0}</span>
                    <span className="flex items-center gap-1">💬 {post.comments || 0}</span>
                    <span className="flex items-center gap-1 font-medium text-white">
                      자세히 보기 →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HotIssueBanner

