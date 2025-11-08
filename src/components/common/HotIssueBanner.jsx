import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
        if (!db) return
        const postsRef = collection(db, 'posts')
        const q = query(postsRef, orderBy('views', 'desc'), limit(3))
        const querySnapshot = await getDocs(q)
        const postsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          emoji: CATEGORY_EMOJI[doc.data().category] || '📝'
        }))
        setHotPosts(postsData)
      } catch (err) {
        console.error('핫이슈 로드 오류:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHotPosts()
  }, [refreshTrigger])

  if (loading || hotPosts.length === 0) return null

  return (
    <section className="relative bg-gray-50 py-16 text-gray-800 border-t border-gray-200">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-6"
      >
        <h2 className="text-3xl font-bold mb-10 flex items-center gap-2 text-gray-900">
          오늘의 핫이슈
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {hotPosts.map((post, i) => {
            // ✅ 이미지 필드 확인 (배열 or 문자열 모두 처리)
            const hasImage =
              (Array.isArray(post.images) && post.images.length > 0 && post.images[0].trim() !== '') ||
              (typeof post.images === 'string' && post.images.trim() !== '')

            const imageSrc = Array.isArray(post.images) ? post.images[0] : post.images

            return (
              <motion.div
                key={post.id}
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                onClick={() => onPostClick && onPostClick(post.id)}
                className="cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-200 transition-all duration-300"
              >
                {/* ✅ 이미지가 있으면 썸네일, 없으면 이모지 */}
                {hasImage ? (
                  <div className="w-full h-40 bg-gray-100 overflow-hidden">
                    <img
                      src={imageSrc}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-6xl">
                    {post.emoji}
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      {i + 1}위
                    </span>
                    <span className="text-2xl">{post.emoji}</span>
                  </div>

                  <h3 className="text-lg font-semibold mb-2 line-clamp-1 text-gray-900">
                    {post.title}
                  </h3>

                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {post.category || '기타'}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>👁 {post.views || 0}</span>
                    <span>❤️ {post.likes || 0}</span>
                    <span>💬 {post.comments || 0}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </section>
  )
}

export default HotIssueBanner
