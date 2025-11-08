import { useState, useEffect } from 'react'

// 축제 데이터 타입 정의
const festivals = [
  {
    id: 1,
    title: '여수밤바다 불꽃축제',
    date: '2025.11.08 ~ 2025.11.08',
    location: '전라남도 여수시',
    status: '개최중',
    url: 'https://korean.visitkorea.or.kr/kfes/list/wntyFstvlList.do',
    emoji: '🎆'
  },
  {
    id: 2,
    title: '경남고성공룡세계엑스포',
    date: '2025.10.01 ~ 2025.11.09',
    location: '경상남도 고성군',
    status: '개최중',
    url: 'https://korean.visitkorea.or.kr/kfes/list/wntyFstvlList.do',
    emoji: '🦕'
  },
  {
    id: 3,
    title: '무안 YD 페스티벌',
    date: '2025.11.14 ~ 2025.11.16',
    location: '전라남도 무안군',
    status: '개최예정',
    url: 'https://korean.visitkorea.or.kr/kfes/list/wntyFstvlList.do',
    emoji: '🎪'
  }
]

function FestivalBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // 자동 슬라이드 (8초마다)
  useEffect(() => {
    if (isPaused || festivals.length <= 1) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev < festivals.length - 1 ? prev + 1 : 0))
    }, 8000)

    return () => clearInterval(interval)
  }, [isPaused])

  const handleFestivalClick = () => {
    const festival = festivals[currentSlide]
    window.open(festival.url, '_blank')
  }

  if (festivals.length === 0) return null

  const currentFestival = festivals[currentSlide]

  return (
    <div className="relative bg-gradient-to-r from-purple-100 to-pink-100 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-white/80 backdrop-blur-sm rounded-lg p-8 shadow-lg cursor-pointer hover:shadow-xl transition" onClick={handleFestivalClick}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  currentFestival.status === '개최중' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-500 text-white'
                }`}>
                  {currentFestival.status}
                </span>
                <h2 className="text-3xl font-bold text-gray-800">
                  {currentFestival.title}
                </h2>
              </div>
              <p className="text-lg text-gray-600 mb-2">
                {currentFestival.date}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                📍 {currentFestival.location}
              </p>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  handleFestivalClick()
                }}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                알아보기
              </button>
            </div>
            <div className="hidden md:flex items-center gap-4 text-6xl">
              <span>{currentFestival.emoji}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{currentSlide + 1}/{festivals.length}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setIsPaused(!isPaused)
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isPaused ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentSlide((prev) => (prev > 0 ? prev - 1 : festivals.length - 1))
                }}
                className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition"
              >
                ←
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentSlide((prev) => (prev < festivals.length - 1 ? prev + 1 : 0))
                }}
                className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FestivalBanner

