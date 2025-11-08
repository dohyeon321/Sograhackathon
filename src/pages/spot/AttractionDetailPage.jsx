import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db, storage } from '../../firebase/config'
import { collection, addDoc, query, orderBy, getDocs, serverTimestamp, doc, updateDoc, where } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getAttractionData } from './DaejeonChungcheongPage'

function AttractionDetailPage({ region, attractionId, onBack, onPhotoUploaded }) {
  const { currentUser, userData } = useAuth()
  const [attraction, setAttraction] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewContent, setReviewContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [photos, setPhotos] = useState([])
  const [coverPhoto, setCoverPhoto] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    // 명소 데이터 가져오기
    const attractionData = getAttractionData(region, attractionId)
    setAttraction(attractionData)
    setLoading(false)
  }, [region, attractionId])

  useEffect(() => {
    // 후기 목록 가져오기
    const fetchReviews = async () => {
      if (!db || !attraction) return

      try {
        const reviewsRef = collection(db, 'attractions', `${region}_${attractionId}`, 'reviews')
        const q = query(reviewsRef, orderBy('createdAt', 'desc'))
        const querySnapshot = await getDocs(q)
        
        const reviewsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        setReviews(reviewsData)
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('후기 불러오기 실패:', error)
        }
      }
    }

    // 사진 목록 가져오기
    const fetchPhotos = async () => {
      if (!db || !attraction) return

      try {
        const photosRef = collection(db, 'attractions', `${region}_${attractionId}`, 'photos')
        const q = query(photosRef, orderBy('createdAt', 'desc'))
        const querySnapshot = await getDocs(q)
        
        const photosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        setPhotos(photosData)
        
        // 표지 사진 랜덤 선택 (모든 사진 중에서)
        if (photosData.length > 0) {
          const randomIndex = Math.floor(Math.random() * photosData.length)
          setCoverPhoto(photosData[randomIndex].imageUrl)
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('사진 불러오기 실패:', error)
        }
      }
    }

    fetchReviews()
    fetchPhotos()
  }, [db, region, attractionId, attraction])

  const handleSubmitReview = async (e) => {
    e.preventDefault()

    // 로컬 인증 확인
    if (!userData?.isLocal) {
      alert('로컬 인증된 사용자만 후기를 작성할 수 있습니다.')
      return
    }

    // 내용 길이 확인 (100-500자)
    const contentLength = reviewContent.trim().length
    if (contentLength < 100) {
      alert('후기는 최소 100자 이상 작성해주세요.')
      return
    }
    if (contentLength > 500) {
      alert('후기는 최대 500자까지 작성할 수 있습니다.')
      return
    }

    if (!db || !currentUser || !attraction) return

    setIsSubmitting(true)

    try {
      const reviewsRef = collection(db, 'attractions', `${region}_${attractionId}`, 'reviews')
      await addDoc(reviewsRef, {
        authorId: currentUser.uid,
        authorName: userData?.displayName || currentUser.email?.split('@')[0] || '익명',
        content: reviewContent.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // 후기 목록 새로고침
      const q = query(reviewsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const reviewsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setReviews(reviewsData)

      setReviewContent('')
      alert('후기가 등록되었습니다!')
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('후기 작성 실패:', error)
      }
      alert('후기 작성 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '방금 전'
    
    const now = new Date()
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const diff = now - date
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}일 전`
    if (hours > 0) return `${hours}시간 전`
    if (minutes > 0) return `${minutes}분 전`
    return '방금 전'
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser || !userData?.isLocal || !db || !storage) return

    // 파일 검증
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    
    if (!file.type.startsWith('image/') || !ALLOWED_TYPES.includes(file.type)) {
      alert('지원하지 않는 파일 형식입니다. (JPEG, PNG, GIF, WebP만 가능)')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('파일 크기가 너무 큽니다. (최대 5MB)')
      return
    }

    setIsUploading(true)

    try {
      // Firebase Storage에 업로드
      const safeFileName = `${currentUser.uid}_${Date.now()}.${file.name.split('.').pop()?.toLowerCase() || 'jpg'}`
      const sanitizedFileName = safeFileName.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storageRef = ref(storage, `attractions/${region}_${attractionId}/${sanitizedFileName}`)
      
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      // Firestore에 사진 정보 저장 (isCover 필드 제거 - 랜덤 선택 방식 사용)
      const photosRef = collection(db, 'attractions', `${region}_${attractionId}`, 'photos')
      await addDoc(photosRef, {
        authorId: currentUser.uid,
        authorName: userData?.displayName || currentUser.email?.split('@')[0] || '익명',
        imageUrl: downloadURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // 사진 목록 새로고침
      const q = query(photosRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const photosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPhotos(photosData)

      // 표지 사진 랜덤 업데이트 (모든 사진 중에서)
      if (photosData.length > 0) {
        const randomIndex = Math.floor(Math.random() * photosData.length)
        setCoverPhoto(photosData[randomIndex].imageUrl)
      }
      
      // 부모 컴포넌트에 알림 (목록 페이지 새로고침)
      if (onPhotoUploaded) {
        onPhotoUploaded(region, attractionId, null)
      }

      alert('사진이 업로드되었습니다!')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('사진 업로드 실패:', error)
      }
      alert('사진 업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  // 표지 사진 수동 선택 기능 제거 (랜덤 방식 사용)

  if (loading || !attraction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
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

        {/* 명소 정보 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className={`h-64 ${coverPhoto ? 'relative' : `bg-gradient-to-br ${attraction.color || 'from-blue-400 to-purple-400'} flex items-center justify-center`}`}>
            {coverPhoto ? (
              <img src={coverPhoto} alt={attraction.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-8xl">{attraction.emoji || '📍'}</div>
            )}
          </div>
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{attraction.name}</h1>
            <p className="text-lg text-gray-600 mb-4">{attraction.description}</p>
            {attraction.info && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">상세 정보</h3>
                <p className="text-gray-700 leading-relaxed">{attraction.info}</p>
              </div>
            )}
            <div className="flex items-center gap-2 text-blue-500">
              <span>📍</span>
              <span>{attraction.location}</span>
            </div>
          </div>
        </div>

        {/* 사진 업로드 (로컬 인증 사용자만) */}
        {currentUser && userData?.isLocal && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">사진 업로드</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={isUploading}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className={`inline-block bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading ? '업로드 중...' : '📷 사진 업로드'}
            </label>
            <p className="text-sm text-gray-500 mt-2">
              직접 찍은 명소 사진을 업로드해주세요. (최대 5MB)
            </p>
          </div>
        )}

        {/* 사진 갤러리 */}
        {photos.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              로컬 사진 갤러리 ({photos.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.imageUrl}
                    alt="명소 사진"
                    className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                    onClick={() => setSelectedPhoto(photo)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 사진 확대 모달 */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="max-w-4xl max-h-full">
              <img
                src={selectedPhoto.imageUrl}
                alt="명소 사진"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* 찐대충 후기 작성 폼 (로컬 인증 사용자만) */}
        {currentUser && userData?.isLocal && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-2 border-yellow-400">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold text-gray-800">찐대충 후기</h2>
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs font-semibold">
                🏡 로컬 전용
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4 bg-yellow-50 p-3 rounded-lg">
              💡 찐대충인 로컬 인증 사용자만 작성할 수 있는 후기입니다. 이 명소에 대한 솔직한 후기를 남겨주세요!
            </p>
            <form onSubmit={handleSubmitReview}>
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="이 명소에 대한 찐대충 후기를 작성해주세요. (100-500자)"
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">
                  {reviewContent.length} / 500자 (최소 100자)
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting || reviewContent.trim().length < 100}
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-2 rounded-lg font-medium hover:from-yellow-500 hover:to-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '작성 중...' : '찐대충 후기 등록'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 로컬 인증 안내 */}
        {currentUser && !userData?.isLocal && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🏡</span>
              <p className="text-yellow-800 font-semibold">찐대충 후기는 로컬 인증 사용자만 작성 가능합니다</p>
            </div>
            <p className="text-yellow-700 text-sm">
              프로필에서 로컬 인증을 완료하시면 찐대충 후기를 작성하실 수 있습니다.
            </p>
          </div>
        )}

        {!currentUser && (
          <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔒</span>
              <p className="text-blue-800 font-semibold">찐대충 후기는 로컬 인증 사용자만 작성 가능합니다</p>
            </div>
            <p className="text-blue-700 text-sm">
              로그인하고 로컬 인증을 완료하시면 찐대충 후기를 작성하실 수 있습니다.
            </p>
          </div>
        )}

        {/* 찐대충 후기 목록 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              찐대충 후기 ({reviews.length})
            </h2>
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-1 rounded text-xs font-semibold">
              🏡 로컬 전용
            </span>
          </div>
          
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              아직 작성된 후기가 없습니다.
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {review.authorName?.[0] || '익'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{review.authorName}</span>
                        <span className="bg-yellow-400 text-white px-2 py-0.5 rounded text-xs font-semibold">
                          로컬
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatTimeAgo(review.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {review.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AttractionDetailPage

