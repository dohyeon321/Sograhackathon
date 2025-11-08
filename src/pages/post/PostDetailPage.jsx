import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc, increment, collection, query, orderBy, getDocs, addDoc, serverTimestamp, deleteDoc, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'

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

function PostDetailPage({ postId, onBack }) {
  const { currentUser } = useAuth()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [liked, setLiked] = useState(false)
  const [viewed, setViewed] = useState(false)

  useEffect(() => {
    if (postId) {
      fetchPost()
      fetchComments()
    }
  }, [postId])

  const fetchPost = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!db) {
        throw new Error('Firebase가 초기화되지 않았습니다.')
      }

      const postRef = doc(db, 'posts', postId)
      const postSnap = await getDoc(postRef)

      if (!postSnap.exists()) {
        throw new Error('게시물을 찾을 수 없습니다.')
      }

      const postData = postSnap.data()
      setPost({
        id: postSnap.id,
        ...postData,
        emoji: CATEGORY_EMOJI[postData.category] || '📝',
        timeAgo: formatTimeAgo(postData.createdAt)
      })

      // 조회수 증가 (한 번만)
      if (!viewed) {
        await updateDoc(postRef, {
          views: increment(1)
        })
        setViewed(true)
      }

      // 좋아요 여부 확인
      if (currentUser) {
        checkLiked()
      }
    } catch (err) {
      console.error('게시물 불러오기 에러:', err)
      setError(err.message || '게시물을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const checkLiked = async () => {
    try {
      if (!currentUser || !postId) return

      const likesRef = collection(db, 'likes')
      const likesQuery = query(
        likesRef,
        where('postId', '==', postId),
        where('userId', '==', currentUser.uid)
      )
      const likesSnapshot = await getDocs(likesQuery)
      
      setLiked(!likesSnapshot.empty)
    } catch (err) {
      console.error('좋아요 확인 에러:', err)
    }
  }

  const fetchComments = async () => {
    try {
      if (!db || !postId) {
        console.warn('댓글 불러오기: db 또는 postId가 없습니다.', { db: !!db, postId })
        return
      }

      console.log('댓글 불러오기 시작:', postId)

      const commentsRef = collection(db, 'comments')
      
      // 인덱스 문제를 피하기 위해 먼저 where만 사용
      try {
        const q = query(
          commentsRef, 
          where('postId', '==', postId),
          orderBy('createdAt', 'asc')
        )
        const querySnapshot = await getDocs(q)

        const commentsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timeAgo: formatTimeAgo(doc.data().createdAt)
        }))

        console.log('댓글 불러오기 성공:', commentsData.length, '개')
        setComments(commentsData)
      } catch (indexError) {
        // 인덱스 에러인 경우 orderBy 없이 시도
        console.warn('인덱스 에러, orderBy 없이 시도:', indexError)
        const q = query(commentsRef, where('postId', '==', postId))
        const querySnapshot = await getDocs(q)

        const commentsData = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            timeAgo: formatTimeAgo(doc.data().createdAt)
          }))
          .sort((a, b) => {
            // 클라이언트에서 정렬
            if (!a.createdAt || !b.createdAt) return 0
            return a.createdAt.toMillis() - b.createdAt.toMillis()
          })

        console.log('댓글 불러오기 성공 (정렬 없이):', commentsData.length, '개')
        setComments(commentsData)
      }
    } catch (err) {
      console.error('댓글 불러오기 에러:', err)
      setError(`댓글을 불러오는 중 오류가 발생했습니다: ${err.message || '알 수 없는 오류'}`)
    }
  }

  const handleLike = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.')
      return
    }

    try {
      if (!db || !postId) return

      const likesRef = collection(db, 'likes')
      const likesQuery = query(
        likesRef,
        where('postId', '==', postId),
        where('userId', '==', currentUser.uid)
      )
      const likesSnapshot = await getDocs(likesQuery)
      
      const existingLike = likesSnapshot.docs[0]

      const postRef = doc(db, 'posts', postId)

      if (existingLike) {
        // 좋아요 취소
        await deleteDoc(doc(db, 'likes', existingLike.id))
        await updateDoc(postRef, {
          likes: increment(-1)
        })
        setLiked(false)
        setPost(prev => ({ ...prev, likes: prev.likes - 1 }))
      } else {
        // 좋아요 추가
        await addDoc(likesRef, {
          postId: postId,
          userId: currentUser.uid,
          createdAt: serverTimestamp()
        })
        await updateDoc(postRef, {
          likes: increment(1)
        })
        setLiked(true)
        setPost(prev => ({ ...prev, likes: prev.likes + 1 }))
      }
    } catch (err) {
      console.error('좋아요 처리 에러:', err)
      alert('좋아요 처리 중 오류가 발생했습니다.')
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    
    if (!currentUser) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!commentText.trim()) {
      alert('댓글을 입력해주세요.')
      return
    }

    try {
      setSubmittingComment(true)
      
      if (!db || !postId) return

      const commentsRef = collection(db, 'comments')
      await addDoc(commentsRef, {
        postId: postId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || '익명',
        content: commentText.trim(),
        createdAt: serverTimestamp()
      })

      // 댓글 수 증가
      const postRef = doc(db, 'posts', postId)
      await updateDoc(postRef, {
        comments: increment(1)
      })

      setCommentText('')
      
      // 댓글 목록 새로고침
      await fetchComments()
      
      // 게시물 정보 새로고침 (댓글 수 업데이트)
      await fetchPost()
      
      console.log('댓글 작성 완료')
    } catch (err) {
      console.error('댓글 작성 에러:', err)
      console.error('에러 상세:', {
        code: err.code,
        message: err.message,
        stack: err.stack
      })
      alert(`댓글 작성 중 오류가 발생했습니다: ${err.message || '알 수 없는 오류'}`)
    } finally {
      setSubmittingComment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">게시물을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || '게시물을 찾을 수 없습니다.'}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            돌아가기
          </button>
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

        {/* 게시물 내용 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* 이미지 */}
          {post.images && post.images.length > 0 && (
            <div className="relative h-96 bg-gray-200">
              <img
                src={post.images[0]}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded text-sm font-semibold text-gray-700">
                {post.category}
              </div>
            </div>
          )}

          <div className="p-6">
            {/* 제목 */}
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{post.title}</h1>

            {/* 작성자 정보 */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {post.authorName?.[0] || post.author?.[0] || '익'}
              </div>
              <div>
                <p className="font-medium text-gray-800">{post.authorName || post.author || '익명'}</p>
                <p className="text-sm text-gray-500">{post.timeAgo} • 📍 {post.location}</p>
              </div>
            </div>

            {/* 본문 */}
            <div className="prose max-w-none mb-8">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
            </div>

            {/* 통계 */}
            <div className="flex items-center gap-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  liked
                    ? 'bg-red-50 text-red-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-xl">{liked ? '❤️' : '🤍'}</span>
                <span className="font-medium">{post.likes || 0}</span>
              </button>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-xl">💬</span>
                <span className="font-medium">{post.comments || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-xl">👁️</span>
                <span className="font-medium">{post.views || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">댓글 {comments.length}</h2>

          {/* 댓글 작성 폼 */}
          {currentUser ? (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="댓글을 입력하세요..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingComment ? '작성 중...' : '댓글 작성'}
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center text-gray-600">
              댓글을 작성하려면 로그인이 필요합니다.
            </div>
          )}

          {/* 댓글 목록 */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">댓글이 없습니다.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {comment.userName?.[0] || '익'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">{comment.userName || '익명'}</span>
                      <span className="text-sm text-gray-500">{comment.timeAgo}</span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostDetailPage

