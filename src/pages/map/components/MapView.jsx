import { useRef, useState, useEffect } from 'react'
import { useLoadScript, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../../firebase/config'

const containerStyle = {
  width: '100%',
  height: 'calc(100vh - 200px)',
  minHeight: '500px'
}

const center = {
  lat: 36.3504,
  lng: 127.3845
}

const mapOptions = {
  zoom: 13,
  center: center,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false
}

const CATEGORY_EMOJI = {
  '맛집': '🍽️',
  '교통': '🚗',
  '핫플': '🎉',
  '꿀팁': '💡'
}

function MapView({ onPostClick }) {
  const [posts, setPosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [selectedLocationPosts, setSelectedLocationPosts] = useState([]) // 같은 위치의 게시물들
  const [showSidebar, setShowSidebar] = useState(false) // 사이드 창 표시 여부
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [mapError, setMapError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState(null) // 현재 위치
  const [locationError, setLocationError] = useState(null) // 위치 에러
  const [isGettingLocation, setIsGettingLocation] = useState(false) // 위치 가져오는 중
  const mapRef = useRef(null)

  const categories = ['전체', '맛집', '교통', '핫플', '꿀팁']
  // Google Maps API 키 - 프로덕션에서는 환경 변수 필수
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || (import.meta.env.DEV ? "AIzaSyCkjBmgtHXCCUGyEmEOC2z4HJ73Ah1EgrM" : null)
  
  // libraries 배열을 상수로 빼서 성능 경고 방지
  const libraries = ['places']

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: libraries
  })

  // Firestore에서 게시물 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        setMapError(null)
        
        if (!db) {
          if (import.meta.env.DEV) {
            console.warn('Firebase가 초기화되지 않았습니다.')
          }
          setLoading(false)
          return
        }
        
        const postsRef = collection(db, 'posts')
        const querySnapshot = await getDocs(postsRef)
        
        const postsData = querySnapshot.docs
          .map(doc => {
            const data = doc.data()
            // locationLat과 locationLng가 있는 게시물만
            if (data.locationLat && data.locationLng) {
              return {
                id: doc.id,
                ...data,
                lat: data.locationLat,
                lng: data.locationLng,
                emoji: CATEGORY_EMOJI[data.category] || '📝'
              }
            }
            return null
          })
          .filter(post => post !== null)
        
        if (import.meta.env.DEV) {
          console.log('지도용 게시물 수:', postsData.length)
        }
        setPosts(postsData)
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('게시물 불러오기 에러:', err)
        }
        setMapError(`게시물을 불러오는 중 오류가 발생했습니다: ${err.message || '알 수 없는 오류'}`)
      } finally {
        setLoading(false)
      }
    }

    if (isLoaded) {
      fetchPosts()
    }
  }, [isLoaded])

  // 지도 로드 시 자동으로 현재 위치 가져오기는 제거 (사용자가 버튼을 눌렀을 때만)
  // useEffect(() => {
  //   if (isLoaded && navigator.geolocation) {
  //     // 자동으로 현재 위치 가져오기 (사용자 권한 요청)
  //     getCurrentLocation()
  //   }
  // }, [isLoaded])

  const filteredPosts = selectedCategory === '전체'
    ? posts
    : posts.filter(post => post.category === selectedCategory)

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
        
        // 지도 중심을 현재 위치로 이동
        if (mapRef.current) {
          mapRef.current.setCenter(location)
          mapRef.current.setZoom(15)
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

  // API 키가 없을 때
  if (!apiKey || apiKey === 'YOUR_API_KEY') {
    return (
      <div className="relative h-[calc(100vh-200px)] min-h-[500px] bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-4xl mb-4">🗺️</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Google Maps API 키가 필요합니다</h3>
          <p className="text-gray-600 mb-4">
            지도를 사용하려면 Google Maps API 키를 설정해주세요.
          </p>
          <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded text-left">
            <p className="font-semibold mb-2">설정 방법:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>.env 파일을 생성하세요</li>
              <li>VITE_GOOGLE_MAPS_API_KEY=your_api_key 추가</li>
              <li>서버를 재시작하세요</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  // 로딩 중일 때
  if (!isLoaded) {
    return (
      <div className="relative h-[calc(100vh-200px)] min-h-[500px] bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🗺️</div>
          <p className="text-gray-600">지도를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러가 발생했을 때
  if (loadError) {
    console.error('Google Maps 로드 에러:', loadError)
    return (
      <div className="relative h-[calc(100vh-200px)] min-h-[500px] bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">지도를 불러올 수 없습니다</h3>
          <p className="text-gray-600 mb-4">
            {loadError.message || 'Google Maps API 키를 확인해주세요.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* 카테고리 필터 (지도 위) */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              selectedCategory === cat
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 현재 위치 버튼 - 사이드바가 열려있을 때는 왼쪽으로 이동 */}
      <div className={`absolute top-4 z-10 transition-all duration-300 ${showSidebar ? 'right-[400px]' : 'right-4'}`}>
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

      {/* 위치 에러 메시지 - 사이드바가 열려있을 때는 왼쪽으로 이동 */}
      {locationError && (
        <div className={`absolute top-20 z-20 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg max-w-xs transition-all duration-300 ${showSidebar ? 'right-[400px]' : 'right-4'}`}>
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

      {/* Google Maps */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        options={mapOptions}
        onLoad={(map) => {
          mapRef.current = map
        }}
        onClick={() => {
          // 지도 클릭 시 사이드 창 닫기
          setShowSidebar(false)
          setSelectedLocationPosts([])
        }}
      >
        {/* 게시물 마커 */}
        {filteredPosts.map((post) => {
          // 카테고리별 색상 설정
          const categoryColors = {
            '맛집': '#ff5252',
            '교통': '#f1c40f',
            '핫플': '#9b59b6',
            '꿀팁': '#3498db'
          }
          const color = categoryColors[post.category] || '#ff5252'
          const emoji = post.emoji || '📝'
          
          // SVG 아이콘 생성 (카테고리 이모지 사용)
          const svgString = `
            <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
              <circle cx="25" cy="25" r="22" fill="${color}" stroke="white" stroke-width="3"/>
              <text x="25" y="33" font-size="24" text-anchor="middle" fill="white">${emoji}</text>
            </svg>
          `.trim()
          const svgIcon = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
          
          return (
            <Marker
              key={post.id}
              position={{ lat: post.lat, lng: post.lng }}
              icon={{
                url: svgIcon,
                scaledSize: { width: 50, height: 50 },
                anchor: { x: 25, y: 25 }
              }}
              onClick={() => {
                // 마커 클릭 시 같은 위치의 모든 게시물 찾기
                const sameLocationPosts = posts.filter(p => 
                  p.lat === post.lat && p.lng === post.lng
                )
                setSelectedLocationPosts(sameLocationPosts)
                setShowSidebar(true) // 사이드 창 열기
                // InfoWindow는 표시하지 않음
              }}
            />
          )
        })}

      </GoogleMap>
      
      {mapError && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {mapError}
        </div>
      )}

      {/* 사이드 창 */}
      {showSidebar && selectedLocationPosts.length > 0 && (
        <div className="absolute top-0 right-0 w-96 h-full bg-white shadow-2xl z-30 flex flex-col">
          {/* 사이드 창 헤더 */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-800">게시물 목록</h3>
              <p className="text-sm text-gray-500">
                {selectedLocationPosts.length}개의 게시물
              </p>
            </div>
            <button
              onClick={() => {
                setShowSidebar(false)
                setSelectedLocationPosts([])
              }}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 게시물 목록 (스크롤 가능) */}
          <div className="flex-1 overflow-y-auto">
            {selectedLocationPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 border-b border-gray-100 hover:bg-gray-50 transition"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{post.emoji}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-1">{post.title}</h4>
                    <p className="text-xs text-gray-500 mb-2">{post.category}</p>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{post.content?.substring(0, 100)}...</p>
                    <div className="text-xs text-gray-500 mb-2">📍 {post.locationAlias || post.location}</div>
                    <div className="flex gap-3 text-xs text-gray-500 mb-3">
                      <span>❤️ {post.likes || 0}</span>
                      <span>💬 {post.comments || 0}</span>
                      <span>👁️ {post.views || 0}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (onPostClick) {
                      onPostClick(post.id)
                    }
                  }}
                  className="w-full bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                >
                  자세히 보기
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MapView

