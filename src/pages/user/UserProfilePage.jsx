import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'

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


function UserProfilePage({ onBack }) {
  const { currentUser, userData, logout } = useAuth()
  const [userPosts, setUserPosts] = useState([])
  const [userComments, setUserComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('posts') // posts, comments

  useEffect(() => {
    if (currentUser) {
      fetchUserPosts()
      fetchUserComments()
    } else {
      setLoading(false)
    }
  }, [currentUser])

  const fetchUserPosts = async () => {
    try {
      if (!db || !currentUser) return

      const postsRef = collection(db, 'posts')

      try {
        const q = query(
          postsRef,
          where('authorId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        )
        const querySnapshot = await getDocs(q)

        const posts = querySnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            timeAgo: formatTimeAgo(data.createdAt)
          }
        })

        setUserPosts(posts)
      } catch (indexError) {
        // 인덱스 에러인 경우 orderBy 없이 시도
        console.warn('인덱스 에러, orderBy 없이 시도:', indexError)
        const q = query(postsRef, where('authorId', '==', currentUser.uid))
        const querySnapshot = await getDocs(q)

        const posts = querySnapshot.docs
          .map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              timeAgo: formatTimeAgo(data.createdAt)
            }
          })
          .sort((a, b) => {
            // 클라이언트에서 정렬
            if (!a.createdAt || !b.createdAt) return 0
            return b.createdAt.toMillis() - a.createdAt.toMillis()
          })

        setUserPosts(posts)
      }
    } catch (err) {
      console.error('게시물 불러오기 에러:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserComments = async () => {
    try {
      if (!db || !currentUser) return

      const commentsRef = collection(db, 'comments')

      try {
        const q = query(
          commentsRef,
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        )
        const querySnapshot = await getDocs(q)

        const comments = querySnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            timeAgo: formatTimeAgo(data.createdAt)
          }
        })

        setUserComments(comments)
      } catch (indexError) {
        // 인덱스 에러인 경우 orderBy 없이 시도
        console.warn('인덱스 에러, orderBy 없이 시도:', indexError)
        const q = query(commentsRef, where('userId', '==', currentUser.uid))
        const querySnapshot = await getDocs(q)

        const comments = querySnapshot.docs
          .map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              timeAgo: formatTimeAgo(data.createdAt)
            }
          })
          .sort((a, b) => {
            // 클라이언트에서 정렬
            if (!a.createdAt || !b.createdAt) return 0
            return b.createdAt.toMillis() - a.createdAt.toMillis()
          })

        setUserComments(comments)
      }
    } catch (err) {
      console.error('댓글 불러오기 에러:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">로그인이 필요합니다</h2>
            <p className="text-gray-600 mb-6">회원 정보를 보려면 로그인이 필요합니다.</p>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          목록으로
        </button>

        {/* 프로필 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* ✅ 로그아웃 버튼 추가 */}
          <button
            onClick={async () => {
              const result = await logout()
              if (result.success) {
                alert('로그아웃되었습니다.')
                window.location.reload() // or navigate('/login')
              } else {
                alert(result.error)
              }
            }}
            className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
          >
            로그아웃
          </button><div className="flex items-center gap-4 mb-6">
            {/* ✅ 프로필 사진 + 로컬 뱃지 */}
            <div className="relative w-20 h-20">
              <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-semibold">
                {userData?.displayName?.[0] || currentUser?.email?.[0]?.toUpperCase() || '사'}
              </div>

              {/* ✅ 프로필 위 원형 뱃지 (isLocal이 true일 때만 표시) */}
              {userData?.isLocal && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                  🏡
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-800">
                  {userData?.displayName || '사용자'}
                </h1>
                {userData?.isLocal && (
                  <span className="bg-yellow-400 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-sm flex items-center gap-1">
                    🏡 로컬 인증
                  </span>
                )}


              </div>
              <p className="text-gray-600">{userData?.email || currentUser?.email}</p>
              <p className="text-sm text-gray-500 mt-1">📍 {userData?.region || '지역 미설정'}</p>
            </div>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{userPosts.length}</p>
              <p className="text-sm text-gray-500">게시물</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{userComments.length}</p>
              <p className="text-sm text-gray-500">댓글</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">
                {userPosts.reduce((sum, post) => sum + (post.likes || 0), 0)}
              </p>
              <p className="text-sm text-gray-500">받은 좋아요</p>
            </div>
          </div>
          {/* ✅ 로컬 인증 안내 박스 (모든 사용자에게 표시) */}
          <div className="bg-white rounded-lg shadow-sm p-6 mt-8 mb-6">
            <div className="bg-orange-50 border-l-4 border-orange-400 text-orange-700 p-4 rounded-md shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">
                    🏡 로컬 인증은 90일마다 갱신이 필요합니다.
                  </p>

                  {/* ✅ 로컬 여부에 따라 문구 달라짐 */}
                  {userData?.isLocal ? (
                    <p className="text-xs mt-1 text-orange-600">
                      현재 로컬 인증 상태입니다. 인증은 90일간 유효합니다.
                    </p>
                  ) : (
                    <p className="text-xs mt-1 text-orange-600">
                      아직 로컬 인증이 완료되지 않았습니다. 인증 후 로컬 전용 혜택을 이용할 수 있습니다.
                    </p>
                  )}
                </div>

                <button
                  onClick={() => alert('로컬 인증 기능은 준비 중입니다!')}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
                >
                  로컬 인증하러 가기
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 px-6 py-4 font-medium transition ${activeTab === 'posts'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              게시물 ({userPosts.length})
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 px-6 py-4 font-medium transition ${activeTab === 'comments'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              댓글 ({userComments.length})
            </button>
          </div>
        </div>

        {/* 게시물 목록 */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {userPosts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-500">작성한 게시물이 없습니다.</p>
              </div>
            ) : (
              userPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{post.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>📍 {post.location}</span>
                        <span>•</span>
                        <span>{post.timeAgo}</span>
                      </div>
                    </div>
                    {post.images && post.images.length > 0 && (
                      <img
                        src={post.images[0]}
                        alt={post.title}
                        className="w-24 h-24 object-cover rounded-lg ml-4"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100 text-sm text-gray-500">
                    <span>❤️ {post.likes || 0}</span>
                    <span>💬 {post.comments || 0}</span>
                    <span>👁️ {post.views || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 댓글 목록 */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            {userComments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-500">작성한 댓글이 없습니다.</p>
              </div>
            ) : (
              userComments.map((comment) => (
                <div key={comment.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {comment.userName?.[0] || '익'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-800">{comment.userName || '익명'}</span>
                        <span className="text-xs text-gray-500">{comment.timeAgo}</span>
                      </div>
                      <p className="text-gray-700 mb-2">{comment.content}</p>
                      <p className="text-xs text-gray-500">게시물 ID: {comment.postId}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfilePage

