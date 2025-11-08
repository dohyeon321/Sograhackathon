import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { collection, addDoc, serverTimestamp, getDocs, query, limit } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase/config'
import { useLoadScript, GoogleMap, Marker, Autocomplete } from '@react-google-maps/api'

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
    locationAlias: '',
    locationLat: null,
    locationLng: null
  })
  const [selectedImages, setSelectedImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [locationAlias, setLocationAlias] = useState('')
  const autocompleteRef = useRef(null)
  const mapRef = useRef(null)
  
  // Google Maps API 키 - 프로덕션에서는 환경 변수 필수
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || (import.meta.env.DEV ? "AIzaSyCkjBmgtHXCCUGyEmEOC2z4HJ73Ah1EgrM" : null)
  const libraries = ['places']
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: libraries
  })

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">로그인이 필요합니다</h2>
            <p className="text-gray-600 mb-6">게시물을 작성하려면 로그인이 필요합니다.</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    )
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
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

    files.forEach((file) => {
      // 파일 타입 검증
      if (!file.type.startsWith('image/') || !ALLOWED_TYPES.includes(file.type)) {
        setError(`${file.name}: 지원하지 않는 파일 형식입니다. (JPEG, PNG, GIF, WebP만 가능)`)
        return
      }

      // 파일 크기 검증
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name}: 파일 크기가 너무 큽니다. (최대 5MB)`)
        return
      }

      // 파일 이름 검증 (XSS 및 경로 탐색 공격 방지)
      if (file.name.length > 255) {
        setError(`${file.name}: 파일 이름이 너무 깁니다.`)
        return
      }
      
      // 경로 탐색 문자 검증
      if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
        setError(`${file.name}: 파일 이름에 허용되지 않는 문자가 포함되어 있습니다.`)
        return
      }
      
      // 파일 확장자 검증 (화이트리스트)
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        setError(`${file.name}: 지원하지 않는 파일 확장자입니다. (JPEG, PNG, GIF, WebP만 가능)`)
        return
      }

      newImages.push(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target.result)
        setImagePreviews([...imagePreviews, ...newPreviews])
      }
      reader.readAsDataURL(file)
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
    // 기존 별칭이 있으면 불러오기
    setLocationAlias(formData.locationAlias || '')
    setShowMapModal(true)
  }

  const handleMapClick = (e) => {
    if (e.latLng) {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      setSelectedLocation({ lat, lng })
      
      // Geocoding API를 사용해서 주소 가져오기
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const address = results[0].formatted_address
            // 주소는 업데이트하지만 별칭은 유지
            setFormData(prev => ({
              ...prev,
              location: address,
              locationLat: lat,
              locationLng: lng
            }))
          }
        })
      }
    }
  }

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace()
      if (place.geometry) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const address = place.formatted_address || place.name
        
        setSelectedLocation({ lat, lng })
        // 주소는 업데이트하지만 별칭은 유지
        setFormData(prev => ({
          ...prev,
          location: address,
          locationLat: lat,
          locationLng: lng
        }))
      }
    }
  }

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      // 주소는 그대로 유지하고, 별칭만 저장
      setFormData(prev => ({
        ...prev,
        locationAlias: locationAlias.trim()
      }))
      setShowMapModal(false)
    } else {
      alert('지도에서 위치를 선택해주세요.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 입력 검증 및 XSS 방지 (React는 기본적으로 이스케이프하지만 추가 검증)
    const sanitizeInput = (input) => {
      if (!input) return ''
      // HTML 특수문자 제거 및 정리
      return input.trim()
        .replace(/[<>]/g, '') // HTML 태그 문자 제거
        .replace(/javascript:/gi, '') // JavaScript 프로토콜 제거
        .replace(/on\w+=/gi, '') // 이벤트 핸들러 제거
        .replace(/data:/gi, '') // Data URI 제거 (이미지는 별도 처리)
    }
    
    // 파일 이름 검증 (경로 탐색 공격 방지)
    const sanitizeFileName = (fileName) => {
      if (!fileName) return ''
      // 경로 탐색 문자 제거
      return fileName
        .replace(/\.\./g, '') // 상위 디렉토리 탐색 방지
        .replace(/[\/\\]/g, '_') // 경로 구분자 제거
        .replace(/[^a-zA-Z0-9._-]/g, '_') // 특수문자 제거
        .substring(0, 255) // 파일 이름 길이 제한
    }

    if (!formData.title || formData.title.trim().length < 2) {
      setError('제목을 입력해주세요. (최소 2자 이상)')
      return
    }

    if (formData.title.trim().length > 100) {
      setError('제목은 100자 이하여야 합니다.')
      return
    }

    if (!formData.content || formData.content.trim().length < 10) {
      setError('내용을 입력해주세요. (최소 10자 이상)')
      return
    }

    if (formData.content.trim().length > 1000) {
      setError('내용은 1000자 이하여야 합니다.')
      return
    }

    if (!formData.category) {
      setError('카테고리를 선택해주세요.')
      return
    }

    // 카테고리 검증 (허용된 카테고리만)
    const allowedCategories = ['맛집', '교통', '핫플', '꿀팁']
    if (!allowedCategories.includes(formData.category)) {
      setError('올바른 카테고리를 선택해주세요.')
      return
    }

    if (!formData.location || formData.location.trim().length < 2) {
      setError('위치를 입력해주세요.')
      return
    }

    if (formData.location.trim().length > 200) {
      setError('위치는 200자 이하여야 합니다.')
      return
    }

    if (formData.locationAlias && formData.locationAlias.trim().length > 50) {
      setError('위치 별칭은 50자 이하여야 합니다.')
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
      let imageUploadWarning = null
      if (selectedImages.length > 0 && storage) {
        try {
          for (let i = 0; i < selectedImages.length; i++) {
            const file = selectedImages[i]
            
            // 파일 이름 보안 검증 (경로 탐색 공격 방지)
            // 사용자 입력 파일 이름 대신 안전한 파일 이름 생성
            const safeFileName = `${currentUser.uid}_${Date.now()}_${i}.${file.name.split('.').pop()?.toLowerCase() || 'jpg'}`
            // 경로 탐색 문자 제거
            const sanitizedFileName = safeFileName.replace(/[^a-zA-Z0-9._-]/g, '_')
            
            const storageRef = ref(storage, `posts/${sanitizedFileName}`)
            
            try {
              await uploadBytes(storageRef, file)
              const downloadURL = await getDownloadURL(storageRef)
              imageUrls.push(downloadURL)
            } catch (uploadError) {
              if (import.meta.env.DEV) {
                console.warn(`이미지 ${i + 1} 업로드 실패:`, uploadError)
              }
              // 개별 이미지 업로드 실패는 무시하고 계속 진행
              if (!imageUploadWarning) {
                imageUploadWarning = `일부 이미지 업로드에 실패했습니다. (CORS 또는 Storage 규칙을 확인하세요)`
              }
            }
          }
        } catch (imageError) {
          if (import.meta.env.DEV) {
            console.warn('이미지 업로드 실패:', imageError)
          }
          imageUploadWarning = `이미지 업로드에 실패했습니다. (CORS 또는 Storage 규칙을 확인하세요) 게시물은 저장됩니다.`
        }
      }

      // Firestore에 게시물 저장 (입력값 정리 및 XSS 방지)
      const postData = {
        title: sanitizeInput(formData.title.trim()),
        content: sanitizeInput(formData.content.trim()),
        category: formData.category, // 카테고리는 허용된 값만 사용
        location: sanitizeInput(formData.location.trim()),
        locationAlias: formData.locationAlias ? sanitizeInput(formData.locationAlias.trim()) : null,
        locationLat: typeof formData.locationLat === 'number' ? formData.locationLat : null, // 타입 검증
        locationLng: typeof formData.locationLng === 'number' ? formData.locationLng : null, // 타입 검증
        images: Array.isArray(imageUrls) ? imageUrls : [], // 배열 타입 검증
        authorId: currentUser.uid, // Firebase에서 검증됨
        authorName: sanitizeInput(userData?.displayName || currentUser.email || '익명'),
        authorRegion: sanitizeInput(userData?.region || ''),
        likes: 0,
        comments: 0,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // 개발 모드에서만 로그 출력
      if (import.meta.env.DEV) {
        console.log('게시물 저장 시도')
        console.log('Firebase DB 상태:', db ? '초기화됨' : '초기화 안됨')
      }
      
      // Firestore 연결 테스트 (개발 모드에서만)
      if (import.meta.env.DEV) {
        try {
          const testRef = collection(db, 'posts')
          const testQuery = query(testRef, limit(1))
          await getDocs(testQuery)
          console.log('Firestore 연결 확인됨')
        } catch (testError) {
          console.error('Firestore 연결 테스트 실패:', testError)
        }
      }
      
      try {
        // 타임아웃을 10초로 단축
        const savePromise = addDoc(collection(db, 'posts'), postData)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('저장 시간이 초과되었습니다. Firestore 규칙과 네트워크를 확인해주세요.')), 10000)
        )
        
        const docRef = await Promise.race([savePromise, timeoutPromise])
        if (import.meta.env.DEV) {
          console.log('게시물 저장 성공:', docRef.id)
        }
      } catch (saveError) {
        if (import.meta.env.DEV) {
          console.error('addDoc 실행 중 에러:', saveError)
          console.error('에러 상세:', {
            code: saveError.code,
            message: saveError.message
          })
        }
        throw saveError
      }

      // 폼 초기화
      setFormData({
        title: '',
        content: '',
        category: '',
        location: '',
        locationAlias: '',
        locationLat: null,
        locationLng: null
      })
      setSelectedImages([])
      setImagePreviews([])
      setLocationAlias('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // 이미지 업로드 경고가 있으면 표시
      if (imageUploadWarning) {
        alert(imageUploadWarning)
      }

      // 모달 닫기
      onClose()
      
      // 성공 콜백 호출 (게시물 목록 새로고침)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('게시물 작성 에러:', error)
        console.error('에러 코드:', error.code)
        console.error('에러 메시지:', error.message)
      }
      
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
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 대전 중구 은행동"
                  required
                  readOnly
                />
                <button
                  type="button"
                  onClick={handleLocationSelect}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                >
                  지도에서 선택
                </button>
              </div>
              <input
                type="text"
                id="locationAlias"
                name="locationAlias"
                value={formData.locationAlias}
                onChange={(e) => setFormData({ ...formData, locationAlias: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="별칭을 입력하세요 (선택사항, 예: 우리 집 근처 맛집)"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                별칭을 입력하면 게시판 목록에서는 별칭이, 상세 페이지에서는 주소가 표시됩니다.
              </p>
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

      {/* 지도 모달 */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[80vh] max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">위치 선택</h3>
              <button
                onClick={() => {
                  setShowMapModal(false)
                  setSelectedLocation(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-hidden" style={{ minHeight: '500px', height: '60vh' }}>
              {!isLoaded ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="mt-4 text-gray-600">지도를 불러오는 중...</p>
                  </div>
                </div>
              ) : loadError ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-red-500">지도를 불러오는 중 오류가 발생했습니다.</p>
                    <p className="text-sm text-gray-500 mt-2">{loadError.message}</p>
                  </div>
                </div>
              ) : (
                <div className="h-full relative" style={{ minHeight: '500px' }}>
                  {/* 주소 검색 */}
                  <div className="absolute top-4 left-4 right-4 z-10">
                    <Autocomplete
                      onLoad={(autocomplete) => {
                        autocompleteRef.current = autocomplete
                      }}
                      onPlaceChanged={handlePlaceSelect}
                      options={{
                        componentRestrictions: { country: 'kr' },
                        fields: ['formatted_address', 'geometry', 'name']
                      }}
                    >
                      <input
                        type="text"
                        placeholder="주소를 검색하세요 (예: 대전 중구 은행동)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </Autocomplete>
                  </div>

                  {/* 지도 */}
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%', minHeight: '500px' }}
                    center={selectedLocation || { lat: 36.3504, lng: 127.3845 }}
                    zoom={selectedLocation ? 15 : 13}
                    onClick={handleMapClick}
                    options={{
                      mapTypeControl: false,
                      streetViewControl: false,
                      fullscreenControl: false
                    }}
                    onLoad={(map) => {
                      mapRef.current = map
                    }}
                  >
                    {selectedLocation && (
                      <Marker
                        position={selectedLocation}
                        icon={{
                          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                        }}
                      />
                    )}
                  </GoogleMap>
                </div>
              )}
            </div>

            {/* 별칭 입력 */}
            {selectedLocation && (
              <div className="p-4 border-t border-gray-200">
                <label htmlFor="locationAlias" className="block text-sm font-medium text-gray-700 mb-2">
                  위치 별칭 (선택사항)
                </label>
                <input
                  type="text"
                  id="locationAlias"
                  value={locationAlias}
                  onChange={(e) => setLocationAlias(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 우리 집 근처 맛집, 대전역 앞 카페 등"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  별칭을 입력하면 주소 대신 별칭이 표시됩니다. (현재 주소: {formData.location})
                </p>
              </div>
            )}

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMapModal(false)
                  setSelectedLocation(null)
                  setLocationAlias('')
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                취소
              </button>
              <button
                onClick={handleConfirmLocation}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                위치 선택
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WritePage

