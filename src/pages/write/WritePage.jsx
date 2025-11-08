import { useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { collection, addDoc, serverTimestamp, getDocs, query, limit } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase/config'

const CATEGORIES = [
  { id: '맛집', label: '맛집', emoji: '🍽️' },
  { id: '교통', label: '교통', emoji: '🚗' },
  { id: '핫플', label: '핫플', emoji: '🎉' },
  { id: '꿀팁', label: '꿀팁', emoji: '💡' }
]

function WritePage({ onClose, onSuccess }) {
  const { currentUser, userData } = useAuth()
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    location: '',
    locationLat: null,
    locationLng: null
  })
  const [selectedImages, setSelectedImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!currentUser) {
    return null
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + selectedImages.length > 5) {
      setError('최대 5장까지 업로드할 수 있습니다.')
      return
    }

    const newImages = []
    const newPreviews = []

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        newImages.push(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          newPreviews.push(e.target.result)
          setImagePreviews([...imagePreviews, ...newPreviews])
        }
        reader.readAsDataURL(file)
      }
    })

    setSelectedImages([...selectedImages, ...newImages])
  }

  const handleRemoveImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setSelectedImages(newImages)
    setImagePreviews(newPreviews)
  }

  const handleLocationSelect = () => {
    // 지도에서 위치 선택 기능 (향후 구현)
    alert('지도에서 위치 선택 기능은 곧 추가될 예정입니다.')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 입력 검증
    if (!formData.title || formData.title.trim().length < 2) {
      setError('제목을 입력해주세요. (최소 2자 이상)')
      return
    }

    if (!formData.content || formData.content.trim().length < 10) {
      setError('내용을 입력해주세요. (최소 10자 이상)')
      return
    }

    if (!formData.category) {
      setError('카테고리를 선택해주세요.')
      return
    }

    if (!formData.location || formData.location.trim().length < 2) {
      setError('위치를 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      // Firebase 초기화 확인
      if (!db) {
        throw new Error('Firebase가 초기화되지 않았습니다. 페이지를 새로고침해주세요.')
      }

      if (!currentUser) {
        throw new Error('로그인이 필요합니다.')
      }

      // 이미지 업로드 (실패해도 게시물은 저장)
      const imageUrls = []
      if (selectedImages.length > 0 && storage) {
        try {
          for (let i = 0; i < selectedImages.length; i++) {
            const file = selectedImages[i]
            const fileName = `${currentUser.uid}_${Date.now()}_${i}`
            const storageRef = ref(storage, `posts/${fileName}`)
            await uploadBytes(storageRef, file)
            const downloadURL = await getDownloadURL(storageRef)
            imageUrls.push(downloadURL)
          }
        } catch (imageError) {
          console.warn('이미지 업로드 실패:', imageError)
          // 이미지 업로드 실패해도 게시물은 저장
        }
      }

      // Firestore에 게시물 저장
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        location: formData.location.trim(),
        locationLat: formData.locationLat || null,
        locationLng: formData.locationLng || null,
        images: imageUrls,
        authorId: currentUser.uid,
        authorName: userData?.displayName || currentUser.email,
        authorRegion: userData?.region || '',
        likes: 0,
        comments: 0,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      console.log('게시물 저장 시도:', postData)
      console.log('현재 사용자:', currentUser?.uid)
      console.log('Firebase DB 상태:', db ? '초기화됨' : '초기화 안됨')
      console.log('사용자 데이터:', userData)
      
      // Firestore 연결 테스트
      console.log('Firestore 연결 테스트 중...')
      try {
        // 간단한 읽기 테스트로 연결 확인
        const testRef = collection(db, 'posts')
        const testQuery = query(testRef, limit(1))
        await getDocs(testQuery)
        console.log('Firestore 연결 확인됨')
      } catch (testError) {
        console.error('Firestore 연결 테스트 실패:', testError)
        // 연결 테스트 실패해도 저장 시도는 계속
        console.warn('연결 테스트 실패했지만 저장을 시도합니다...')
      }
      
      try {
        console.log('addDoc 호출 중...')
        // 타임아웃을 10초로 단축
        const savePromise = addDoc(collection(db, 'posts'), postData)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('저장 시간이 초과되었습니다. Firestore 규칙과 네트워크를 확인해주세요.')), 10000)
        )
        
        const docRef = await Promise.race([savePromise, timeoutPromise])
        console.log('게시물 저장 성공:', docRef.id)
      } catch (saveError) {
        console.error('addDoc 실행 중 에러:', saveError)
        console.error('에러 상세:', {
          code: saveError.code,
          message: saveError.message,
          stack: saveError.stack
        })
        throw saveError
      }

      // 폼 초기화
      setFormData({
        title: '',
        content: '',
        category: '',
        location: '',
        locationLat: null,
        locationLng: null
      })
      setSelectedImages([])
      setImagePreviews([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // 모달 닫기
      onClose()
      
      // 성공 콜백 호출 (게시물 목록 새로고침)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('게시물 작성 에러:', error)
      console.error('에러 코드:', error.code)
      console.error('에러 메시지:', error.message)
      console.error('전체 에러:', error)
      
      let errorMessage = '게시물 작성 중 오류가 발생했습니다.'
      
      if (error.code === 'permission-denied') {
        errorMessage = '권한이 없습니다. 로그인 상태를 확인해주세요. (Firestore 규칙을 확인하세요)'
      } else if (error.code === 'unavailable' || error.code === 'failed-precondition') {
        errorMessage = '네트워크 연결을 확인해주세요. 오프라인 상태일 수 있습니다.'
      } else if (error.code === 'deadline-exceeded') {
        errorMessage = '저장 시간이 초과되었습니다. 네트워크를 확인해주세요.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={onClose}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          목록으로
        </button>

        {/* 게시물 작성 폼 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">게시물 작성</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      formData.category === cat.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="제목을 입력하세요"
                maxLength={100}
                required
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="내용을 입력하세요"
                rows={6}
                maxLength={1000}
                required
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                위치 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 대전 중구 은행동"
                  required
                />
                <button
                  type="button"
                  onClick={handleLocationSelect}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                >
                  지도에서 선택
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사진 (선택사항, 최대 5장)
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition"
              >
                + 사진 추가
              </button>
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`미리보기 ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '작성 중...' : '작성하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default WritePage

