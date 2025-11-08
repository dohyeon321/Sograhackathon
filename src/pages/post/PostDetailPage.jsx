import { useState, useEffect, useRef } from 'react'
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

function PostDetailPage({ postId, onBack, onEditPost }) {
  const { currentUser } = useAuth()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [liked, setLiked] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState(null) // 수정 중인 댓글 ID
  const [editingCommentText, setEditingCommentText] = useState('') // 수정 중인 댓글 내용
  const [deletingCommentId, setDeletingCommentId] = useState(null) // 삭제 중인 댓글 ID
  const viewedRef = useRef(false) // useRef로 변경하여 리렌더링과 무관하게 유지

  useEffect(() => {
    if (postId) {
      // postId가 변경될 때 viewed 상태 초기화
      viewedRef.current = false
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

      // 조회수 증가 (한 번만) - useRef로 중복 실행 방지
      if (!viewedRef.current) {
        viewedRef.current = true // 먼저 플래그 설정하여 중복 실행 방지
        try {
          await updateDoc(postRef, {
            views: increment(1)
          })
        } catch (viewError) {
          // 조회수 증가 실패해도 게시물은 표시
          if (import.meta.env.DEV) {
            console.warn('조회수 증가 실패:', viewError)
          }
          viewedRef.current = false // 실패 시 플래그 초기화
        }
      }

      // 좋아요 여부 확인
      if (currentUser) {
        checkLiked()
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('게시물 불러오기 에러:', err)
      }
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
      if (import.meta.env.DEV) {
        console.error('좋아요 확인 에러:', err)
      }
    }
  }

  const fetchComments = async () => {
    try {
      if (!db || !postId) {
        if (import.meta.env.DEV) {
          console.warn('댓글 불러오기: db 또는 postId가 없습니다.', { db: !!db, postId })
        }
        return
      }

      if (import.meta.env.DEV) {
        console.log('댓글 불러오기 시작:', postId)
      }

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

        if (import.meta.env.DEV) {
          console.log('댓글 불러오기 성공:', commentsData.length, '개')
        }
        setComments(commentsData)
      } catch (indexError) {
        // 인덱스 에러인 경우 orderBy 없이 시도
        if (import.meta.env.DEV) {
          console.warn('인덱스 에러, orderBy 없이 시도:', indexError)
        }
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

        if (import.meta.env.DEV) {
          console.log('댓글 불러오기 성공 (정렬 없이):', commentsData.length, '개')
        }
        setComments(commentsData)
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('댓글 불러오기 에러:', err)
      }
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
      if (import.meta.env.DEV) {
        console.error('좋아요 처리 에러:', err)
      }
      alert('좋아요 처리 중 오류가 발생했습니다.')
    }
  }

  // XSS 방지 함수
  const sanitizeInput = (input) => {
    if (!input) return ''
    // HTML 특수문자 제거 및 정리
    return input.trim()
      .replace(/[<>]/g, '') // HTML 태그 문자 제거
      .replace(/javascript:/gi, '') // JavaScript 프로토콜 제거
      .replace(/on\w+=/gi, '') // 이벤트 핸들러 제거
      .replace(/data:/gi, '') // Data URI 제거
  }

  // 게시물 삭제
  const handleDeletePost = async () => {
    if (!currentUser || !post) return
    
    // 보안: 작성자 확인
    if (post.authorId !== currentUser.uid) {
      alert('본인이 작성한 게시물만 삭제할 수 있습니다.')
      return
    }
    
    if (!confirm('정말 이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }
    
    try {
      if (!db || !postId) return
      
      const postRef = doc(db, 'posts', postId)
      
      // 게시물 삭제
      await deleteDoc(postRef)
      
      // 관련 댓글 삭제 (선택사항 - 댓글은 남겨둘 수도 있음)
      const commentsRef = collection(db, 'comments')
      const commentsQuery = query(commentsRef, where('postId', '==', postId))
      const commentsSnapshot = await getDocs(commentsQuery)
      
      const deletePromises = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)
      
      // 관련 좋아요 삭제
      const likesRef = collection(db, 'likes')
      const likesQuery = query(likesRef, where('postId', '==', postId))
      const likesSnapshot = await getDocs(likesQuery)
      
      const deleteLikePromises = likesSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deleteLikePromises)
      
      alert('게시물이 삭제되었습니다.')
      onBack() // 목록으로 돌아가기
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('게시물 삭제 에러:', err)
      }
      alert('게시물 삭제 중 오류가 발생했습니다.')
    }
  }
  
  // 게시물 수정
  const handleEditPostClick = () => {
    if (!currentUser || !post) return
    
    // 보안: 작성자 확인
    if (post.authorId !== currentUser.uid) {
      alert('본인이 작성한 게시물만 수정할 수 있습니다.')
      return
    }
    
    // 수정 페이지로 이동
    if (onEditPost) {
      onEditPost(postId, post)
    } else {
      alert('수정 기능은 준비 중입니다.')
    }
  }
  
  // 댓글 삭제
  const handleDeleteComment = async (commentId, commentUserId) => {
    if (!currentUser) return
    
    // 보안: 작성자 확인
    if (commentUserId !== currentUser.uid) {
      alert('본인이 작성한 댓글만 삭제할 수 있습니다.')
      return
    }
    
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) {
      return
    }
    
    // 중복 삭제 방지
    if (deletingCommentId === commentId) {
      return
    }
    
    setDeletingCommentId(commentId)
    
    try {
      if (!db || !postId) {
        throw new Error('데이터베이스 또는 게시물 ID가 없습니다.')
      }
      
      // 댓글 존재 여부 확인
      const commentRef = doc(db, 'comments', commentId)
      const commentSnap = await getDoc(commentRef)
      
      if (!commentSnap.exists()) {
        // 이미 삭제된 댓글인 경우 목록만 새로고침
        await fetchComments()
        await fetchPost()
        setDeletingCommentId(null)
        return
      }
      
      // 댓글 삭제
      await deleteDoc(commentRef)
      
      // 게시물의 댓글 수 감소 (음수 방지)
      const postRef = doc(db, 'posts', postId)
      const postSnap = await getDoc(postRef)
      
      if (postSnap.exists()) {
        const currentComments = postSnap.data().comments || 0
        if (currentComments > 0) {
          await updateDoc(postRef, {
            comments: increment(-1)
          })
        } else {
          // 댓글 수가 0이면 0으로 설정
          await updateDoc(postRef, {
            comments: 0
          })
        }
      }
      
      // 댓글 목록 새로고침
      await fetchComments()
      
      // 게시물 정보 새로고침 (댓글 수 업데이트)
      await fetchPost()
      
      if (import.meta.env.DEV) {
        console.log('댓글 삭제 완료')
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('댓글 삭제 에러:', err)
      }
      alert(`댓글 삭제 중 오류가 발생했습니다: ${err.message || '알 수 없는 오류'}`)
    } finally {
      setDeletingCommentId(null)
    }
  }
  
  // 댓글 수정 시작
  const handleStartEditComment = (commentId, commentUserId, currentContent) => {
    if (!currentUser) return
    
    // 보안: 작성자 확인
    if (commentUserId !== currentUser.uid) {
      alert('본인이 작성한 댓글만 수정할 수 있습니다.')
      return
    }
    
    setEditingCommentId(commentId)
    setEditingCommentText(currentContent)
  }
  
  // 댓글 수정 취소
  const handleCancelEditComment = () => {
    setEditingCommentId(null)
    setEditingCommentText('')
  }
  
  // 댓글 수정 저장
  const handleSaveEditComment = async (commentId) => {
    if (!currentUser || !db) return
    
    const newContent = editingCommentText.trim()
    
    if (!newContent) {
      alert('댓글 내용을 입력해주세요.')
      return
    }
    
    if (newContent.length > 500) {
      alert('댓글은 500자 이하여야 합니다.')
      return
    }
    
    try {
      const commentRef = doc(db, 'comments', commentId)
      
      // 댓글 존재 여부 확인
      const commentSnap = await getDoc(commentRef)
      if (!commentSnap.exists()) {
        alert('댓글이 존재하지 않습니다.')
        setEditingCommentId(null)
        setEditingCommentText('')
        await fetchComments()
        return
      }
      
      // 댓글 수정
      await updateDoc(commentRef, {
        content: sanitizeInput(newContent),
        updatedAt: serverTimestamp()
      })
      
      // 수정 모드 종료
      setEditingCommentId(null)
      setEditingCommentText('')
      
      // 댓글 목록 새로고침
      await fetchComments()
      
      if (import.meta.env.DEV) {
        console.log('댓글 수정 완료')
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('댓글 수정 에러:', err)
      }
      alert(`댓글 수정 중 오류가 발생했습니다: ${err.message || '알 수 없는 오류'}`)
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

    // 댓글 길이 제한
    if (commentText.trim().length > 500) {
      alert('댓글은 500자 이하여야 합니다.')
      return
    }

    try {
      setSubmittingComment(true)
      
      if (!db || !postId) return

      const commentsRef = collection(db, 'comments')
      await addDoc(commentsRef, {
        postId: postId, // Firestore에서 검증됨
        userId: currentUser.uid, // Firebase에서 검증됨
        userEmail: sanitizeInput(currentUser.email || ''),
        userName: sanitizeInput(currentUser.displayName || currentUser.email?.split('@')[0] || '익명'),
        content: sanitizeInput(commentText.trim()),
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
      
      if (import.meta.env.DEV) {
        console.log('댓글 작성 완료')
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('댓글 작성 에러:', err)
        console.error('에러 상세:', {
          code: err.code,
          message: err.message
        })
      }
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
            {/* 제목 및 수정/삭제 버튼 */}
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-800 flex-1">{post.title}</h1>
              {/* 작성자만 수정/삭제 버튼 표시 */}
              {currentUser && post.authorId === currentUser.uid && (
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={handleEditPostClick}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            {/* 작성자 정보 */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {post.authorName?.[0] || post.author?.[0] || '익'}
              </div>
              <div>
                <p className="font-medium text-gray-800">{post.authorName || post.author || '익명'}</p>
                <p className="text-sm text-gray-500">
                  {post.timeAgo} • 📍 {post.locationAlias ? `${post.locationAlias} (${post.location})` : post.location}
                </p>
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
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{comment.userName || '익명'}</span>
                        <span className="text-sm text-gray-500">{comment.timeAgo}</span>
                      </div>
                      {/* 작성자만 수정/삭제 버튼 표시 */}
                      {currentUser && comment.userId === currentUser.uid && editingCommentId !== comment.id && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStartEditComment(comment.id, comment.userId, comment.content)}
                            className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id, comment.userId)}
                            disabled={deletingCommentId === comment.id}
                            className="text-xs text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingCommentId === comment.id ? '삭제 중...' : '삭제'}
                          </button>
                        </div>
                      )}
                    </div>
                    {/* 수정 모드 */}
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={3}
                          maxLength={500}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {editingCommentText.length} / 500자
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleCancelEditComment}
                              className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition"
                            >
                              취소
                            </button>
                            <button
                              onClick={() => handleSaveEditComment(comment.id)}
                              className="px-3 py-1 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded transition"
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700">{comment.content}</p>
                    )}
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

