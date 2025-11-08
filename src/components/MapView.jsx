import { useRef, useState } from 'react'
import { useLoadScript, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api'

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

// 게시물 데이터 (지도용)
const mapPosts = [
  { 
    id: 1, 
    lat: 36.3504, 
    lng: 127.3845, 
    title: '은행동 숨은 맛집 발견!', 
    category: '맛집', 
    categoryGroup: '문화',
    emoji: '🍜', 
    color: '#ff5252',
    info: '30년 전통의 작은 분식집인데 진짜 맛있어요. 떡볶이 맛이 예술이고 튀김도 바삭바삭합니다.',
    location: '대전 중구 은행동',
    author: '대전토박이',
    likes: 42,
    comments: 18,
    views: 234
  },
  { 
    id: 2, 
    lat: 36.3621, 
    lng: 127.3447, 
    title: '대전 버스 환승 절약 팁', 
    category: '교통', 
    categoryGroup: '경제',
    emoji: '💰', 
    color: '#f1c40f',
    info: '10년 넘게 대전 살면서 알게 된 버스 꿀팁! 환승 루트 잘 짜면 시간도 돈도 절약 가능합니다.',
    location: '대전 유성구',
    author: '유성구민',
    likes: 67,
    comments: 31,
    views: 512
  },
  { 
    id: 3, 
    lat: 36.3314, 
    lng: 127.4285, 
    title: '대전역 밤길 안전 체크', 
    category: '꿀팁', 
    categoryGroup: '안전',
    emoji: '🚨', 
    color: '#e74c3c',
    info: '대전역 앞이 요즘 완전 핫해졌어요! 새로 생긴 감성 카페들과 맛집들 직접 다녀온 후기입니다.',
    location: '대전 동구 대전역',
    author: '서구댁',
    likes: 89,
    comments: 45,
    views: 892
  },
  { 
    id: 4, 
    lat: 36.3276, 
    lng: 127.4273, 
    title: '쓰레기 분리배출 꿀가이드', 
    category: '꿀팁', 
    categoryGroup: '환경',
    emoji: '♻️', 
    color: '#2ecc71',
    info: '대전에서 쓰레기 분리배출 제대로 하는 법! 환경을 지키면서도 효율적으로 배출하는 팁입니다.',
    location: '대전 동구 중앙시장',
    author: '중구토박이',
    likes: 123,
    comments: 67,
    views: 1200
  },
  { 
    id: 5, 
    lat: 36.3667, 
    lng: 127.3833, 
    title: '대전 문화 축제 일정', 
    category: '관광', 
    categoryGroup: '문화',
    emoji: '🎉', 
    color: '#9b59b6',
    info: '대전에서 열리는 다양한 문화 축제 일정을 정리했습니다. 가족과 함께 즐길 수 있는 축제들!',
    location: '대전 유성구 엑스포',
    author: '대전여행러버',
    likes: 92,
    comments: 34,
    views: 678
  },
  { 
    id: 6, 
    lat: 36.3589, 
    lng: 127.3849, 
    title: '지역 물가 비교 (전통시장)', 
    category: '꿀팁', 
    categoryGroup: '경제',
    emoji: '📊', 
    color: '#3498db',
    info: '대전 전통시장 물가 비교! 어디서 사는 게 가장 저렴한지 현지인이 알려드립니다.',
    location: '대전 동구 대청호',
    author: '자연이조아',
    likes: 65,
    comments: 19,
    views: 523
  }
]

function MapView() {
  const [selectedPost, setSelectedPost] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [mapError, setMapError] = useState(null)
  const mapRef = useRef(null)

  const categories = ['전체', '문화', '경제', '안전', '환경']
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyCkjBmgtHXCCUGyEmEOC2z4HJ73Ah1EgrM"

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: ['places']
  })

  const filteredPosts = selectedCategory === '전체'
    ? mapPosts
    : mapPosts.filter(post => post.categoryGroup === selectedCategory)

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

      {/* Google Maps */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        options={mapOptions}
        onLoad={(map) => {
          mapRef.current = map
        }}
      >
        {filteredPosts.map((post) => {
          // SVG 아이콘 생성 (이모지 지원을 위해 encodeURIComponent 사용)
          const svgString = `
            <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="${post.color}" stroke="white" stroke-width="3"/>
              <text x="20" y="28" font-size="20" text-anchor="middle" fill="white">${post.emoji}</text>
            </svg>
          `.trim()
          const svgIcon = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
          
          return (
            <Marker
              key={post.id}
              position={{ lat: post.lat, lng: post.lng }}
              icon={{
                url: svgIcon,
                scaledSize: { width: 40, height: 40 },
                anchor: { x: 20, y: 20 }
              }}
              onClick={() => setSelectedPost(post)}
            />
          )
        })}

        {selectedPost && (
          <InfoWindow
            position={{ lat: selectedPost.lat, lng: selectedPost.lng }}
            onCloseClick={() => setSelectedPost(null)}
          >
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{selectedPost.emoji}</span>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">{selectedPost.title}</h3>
                  <div className="text-xs" style={{ color: selectedPost.color }}>
                    {selectedPost.categoryGroup}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-2">{selectedPost.info}</p>
              <div className="text-xs text-gray-500 mb-2">📍 {selectedPost.location}</div>
              <div className="flex gap-3 text-xs text-gray-500 mb-3">
                <span>❤️ {selectedPost.likes}</span>
                <span>💬 {selectedPost.comments}</span>
                <span>👁️ {selectedPost.views}</span>
              </div>
              <button
                onClick={() => {
                  alert(`${selectedPost.title} 상세보기 클릭!`)
                  setSelectedPost(null)
                }}
                className="w-full bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-600 transition"
              >
                자세히 보기
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      
      {mapError && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {mapError}
        </div>
      )}
    </div>
  )
}

export default MapView

