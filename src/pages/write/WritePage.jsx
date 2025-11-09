import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { collection, addDoc, serverTimestamp, getDocs, query, limit, doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase/config'
import { useLoadScript, GoogleMap, Marker, Autocomplete } from '@react-google-maps/api'

const CATEGORIES = [
  { id: '맛집', label: '맛집', emoji: '🍽️' },
  { id: '교통', label: '교통', emoji: '🚗' },
  { id: '핫플', label: '핫플', emoji: '🎉' },
  { id: '꿀팁', label: '꿀팁', emoji: '💡' }
]

// libraries 배열을 컴포넌트 외부에 상수로 선언하여 성능 경고 방지
const libraries = ['places']

function WritePage({ onClose, onSuccess, editPostId, editPostData }) {
  const { currentUser, userData } = useAuth()
  const fileInputRef = useRef(null)
  const isEditMode = !!editPostId && !!editPostData
  const [formData, setFormData] = useState({
    title: editPostData?.title || '',
    content: editPostData?.content || '',
    category: editPostData?.category || '',
    location: editPostData?.location || '',
    locationAlias: editPostData?.locationAlias || '',
    locationLat: editPostData?.locationLat || null,
    locationLng: editPostData?.locationLng || null
  })
  const [selectedImages, setSelectedImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([]) // 새로 추가한 이미지 미리보기
  const [existingImages, setExistingImages] = useState(editPostData?.images || []) // 기존 이미지
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [locationAlias, setLocationAlias] = useState('')
  const [clickedAddress, setClickedAddress] = useState('') // 지도 클릭 시 선택한 위치의 주소
  const [currentLocation, setCurrentLocation] = useState(null) // 현재 위치
  const [locationError, setLocationError] = useState(null) // 위치 에러
  const [isGettingLocation, setIsGettingLocation] = useState(false) // 위치 가져오는 중
  const autocompleteRef = useRef(null)
  const mapRef = useRef(null)
  
  // Google Maps API 키 - 환경 변수 필수
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  
  // 프로덕션 환경에서 API 키 확인 (필수)
  if (import.meta.env.PROD && !apiKey) {
    console.error('❌ 프로덕션 환경: Google Maps API 키가 설정되지 않았습니다.')
    throw new Error('Google Maps API 키가 필요합니다. .env 파일에 VITE_GOOGLE_MAPS_API_KEY를 설정하세요.')
  }
  
  // 개발 환경에서 API 키 확인 (경고만 표시)
  if (import.meta.env.DEV && !apiKey) {
    console.warn('⚠️ 개발 환경: Google Maps API 키가 설정되지 않았습니다.')
    console.warn('📝 보안을 위해 .env.example 파일을 참고하여 .env 파일을 생성하고 VITE_GOOGLE_MAPS_API_KEY를 설정하세요.')
    console.warn('📝 현재는 지도 기능이 작동하지 않을 수 있습니다. 프로덕션 배포 전에는 반드시 환경 변수를 설정하세요.')
  }
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: libraries // 컴포넌트 외부에 선언된 상수 사용
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
    // 지도 모달 열 때 selectedLocation 초기화 (새로 선택하도록)
    setSelectedLocation(null)
    setClickedAddress('') // 클릭한 주소도 초기화
    setShowMapModal(true)
  }

  const handleMapClick = (e) => {
    // 지도 클릭 시 (latLng이 있으면 지도 클릭)
    if (e && e.latLng) {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      const clickedLocation = { lat, lng }
      
      if (import.meta.env.DEV) {
        console.log('지도 클릭:', clickedLocation)
      }
      
      // 선택한 위치 설정 (빨간 마커 표시) - 강제로 새 객체 생성하여 리렌더링 보장
      setSelectedLocation({ ...clickedLocation })
      
      // Geocoding API를 사용해서 주소 가져오기
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ location: clickedLocation }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const address = results[0].formatted_address
            setClickedAddress(address) // 클릭한 위치의 주소 표시
            // 주소 업데이트
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
        setClickedAddress(address) // 선택한 위치의 주소 표시
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

  // 현재 위치 가져오기
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('이 브라우저는 위치 서비스를 지원하지 않습니다.')
      return
    }

    setIsGettingLocation(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setCurrentLocation(location)
        setSelectedLocation(location) // 현재 위치를 선택한 위치로 설정
        
        // 지도 중심을 현재 위치로 이동
        if (mapRef.current) {
          mapRef.current.setCenter(location)
          mapRef.current.setZoom(15)
        }
        
        // Geocoding API를 사용해서 주소 가져오기
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder()
          geocoder.geocode({ location: location }, (results, status) => {
            if (status === 'OK' && results[0]) {
              const address = results[0].formatted_address
              setClickedAddress(address) // 클릭한 위치의 주소 표시
              setFormData(prev => ({
                ...prev,
                location: address,
                locationLat: location.lat,
                locationLng: location.lng
              }))
            }
          })
        }
        
        setIsGettingLocation(false)
      },
      (error) => {
        setIsGettingLocation(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('위치 정보를 사용할 수 없습니다.')
            break
          case error.TIMEOUT:
            setLocationError('위치 정보를 가져오는 시간이 초과되었습니다.')
            break
          default:
            setLocationError('위치 정보를 가져오는 중 오류가 발생했습니다.')
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // 지도 모달이 열릴 때 자동으로 현재 위치 가져오기
  useEffect(() => {
    if (showMapModal && isLoaded && navigator.geolocation) {
      getCurrentLocation()
    }
  }, [showMapModal, isLoaded])

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
      const finalImageUrls = [...existingImages, ...imageUrls] // 기존 이미지 + 새 이미지
      
      const postData = {
        title: sanitizeInput(formData.title.trim()),
        content: sanitizeInput(formData.content.trim()),
        category: formData.category, // 카테고리는 허용된 값만 사용
        location: sanitizeInput(formData.location.trim()),
        locationAlias: formData.locationAlias ? sanitizeInput(formData.locationAlias.trim()) : null,
        locationLat: typeof formData.locationLat === 'number' ? formData.locationLat : null, // 타입 검증
        locationLng: typeof formData.locationLng === 'number' ? formData.locationLng : null, // 타입 검증
        images: Array.isArray(finalImageUrls) ? finalImageUrls : [], // 배열 타입 검증
        updatedAt: serverTimestamp()
      }
      
      // 수정 모드가 아닐 때만 초기값 및 작성자 정보 설정
      if (!isEditMode) {
        postData.authorId = currentUser.uid // Firebase에서 검증됨
        postData.authorName = sanitizeInput(userData?.displayName || currentUser.email || '익명')
        postData.authorRegion = sanitizeInput(userData?.region || '')
        postData.authorIsLocal = userData?.isLocal === true // 작성자의 로컬 인증 여부
        postData.likes = 0
        postData.comments = 0
        postData.views = 0
        postData.createdAt = serverTimestamp()
      }
      // 수정 모드에서는 authorId, authorName, authorRegion, likes, comments, views, createdAt은 업데이트하지 않음

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
        if (isEditMode) {
          // 수정 모드: 기존 게시물 업데이트
          // 보안: 작성자 확인
          if (editPostData.authorId !== currentUser.uid) {
            throw new Error('본인이 작성한 게시물만 수정할 수 있습니다.')
          }
          
          const postRef = doc(db, 'posts', editPostId)
          const updatePromise = updateDoc(postRef, {
            ...postData,
            updatedAt: serverTimestamp()
          })
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('수정 시간이 초과되었습니다. Firestore 규칙과 네트워크를 확인해주세요.')), 10000)
          )
          
          await Promise.race([updatePromise, timeoutPromise])
          if (import.meta.env.DEV) {
            console.log('게시물 수정 성공:', editPostId)
          }
        } else {
          // 작성 모드: 새 게시물 생성
          const savePromise = addDoc(collection(db, 'posts'), postData)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('저장 시간이 초과되었습니다. Firestore 규칙과 네트워크를 확인해주세요.')), 10000)
          )
          
          const docRef = await Promise.race([savePromise, timeoutPromise])
          if (import.meta.env.DEV) {
            console.log('게시물 저장 성공:', docRef.id)
          }
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

      // 폼 초기화 (수정 모드가 아닐 때만)
      if (!isEditMode) {
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
        setExistingImages([])
        setLocationAlias('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        // 수정 모드: 새로 추가한 이미지만 초기화
        setSelectedImages([])
        setImagePreviews([])
        setLocationAlias('')
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
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {isEditMode ? '게시물 수정' : '게시물 작성'}
          </h2>

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
                          {(imagePreviews.length > 0 || existingImages.length > 0) && (
                            <div className="grid grid-cols-5 gap-2 mt-2">
                              {/* 기존 이미지 */}
                              {existingImages.map((imageUrl, index) => (
                                <div key={`existing-${index}`} className="relative">
                                  <img
                                    src={imageUrl}
                                    alt={`기존 이미지 ${index + 1}`}
                                    className="w-full h-20 object-cover rounded"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // 기존 이미지 제거
                                      const newExisting = existingImages.filter((_, i) => i !== index)
                                      setExistingImages(newExisting)
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              {/* 새로 추가한 이미지 미리보기 */}
                              {imagePreviews.map((preview, index) => (
                                <div key={`new-${index}`} className="relative">
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
                            {loading ? (isEditMode ? '수정 중...' : '작성 중...') : (isEditMode ? '수정하기' : '작성하기')}
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

                  {/* 현재 위치 버튼 */}
                  <div className="absolute top-20 right-4 z-10">
                    <button
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                      className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      title="현재 위치로 이동"
                    >
                      {isGettingLocation ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          <span className="text-sm font-medium hidden sm:inline">위치 가져오는 중...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm font-medium hidden sm:inline">내 위치</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 위치 에러 메시지 */}
                  {locationError && (
                    <div className="absolute top-28 right-4 z-20 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg max-w-xs">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{locationError}</p>
                          <button
                            onClick={() => setLocationError(null)}
                            className="text-xs mt-1 underline hover:no-underline"
                          >
                            닫기
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 지도 */}
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%', minHeight: '500px' }}
                    center={selectedLocation || currentLocation || { lat: 36.3504, lng: 127.3845 }}
                    zoom={selectedLocation || currentLocation ? 15 : 13}
                    onClick={handleMapClick}
                    options={{
                      mapTypeControl: false,
                      streetViewControl: false,
                      fullscreenControl: false,
                      clickableIcons: false // 마커 클릭 시 지도 클릭 이벤트 방지
                    }}
                    onLoad={(map) => {
                      mapRef.current = map
                    }}
                  >
                    {/* 선택한 위치 마커 - 빨간색 (지도 클릭 시 표시) */}
                    {selectedLocation && (
                      <Marker
                        key={`selected-${selectedLocation.lat}-${selectedLocation.lng}`}
                        position={selectedLocation}
                        icon={{
                          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                          scaledSize: { width: 50, height: 50 },
                          anchor: { x: 25, y: 25 }
                        }}
                        title="선택한 위치"
                        zIndex={1000}
                      />
                    )}
                  </GoogleMap>
                </div>
              )}
            </div>

            {/* 선택한 위치 정보 및 별칭 입력 */}
            {selectedLocation && (
              <div className="p-4 border-t border-gray-200">
                {/* 선택한 위치 주소 표시 */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">선택한 위치</p>
                  <p className="text-sm text-gray-800 font-semibold">
                    {clickedAddress || formData.location || '주소를 가져오는 중...'}
                  </p>
                </div>
                
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
                  별칭을 입력하면 주소 대신 별칭이 표시됩니다.
                </p>
              </div>
            )}

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMapModal(false)
                  setSelectedLocation(null)
                  setLocationAlias('')
                  setClickedAddress('')
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

