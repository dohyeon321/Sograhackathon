import { useState, useEffect } from 'react'

function RegionNewsBanner() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [weather, setWeather] = useState(null)

  // 축제 정보 (나중에 API로 가져올 수 있음)
  const festivals = [
    {
      type: 'festival',
      title: '2025 대전 0시 축제',
      date: '2025년 8월 8일 ~ 16일',
      location: '대전 중구 중앙로 일원',
      emoji: '🎉',
      url: 'https://korean.visitkorea.or.kr/kfes/list/wntyFstvlList.do'
    },
    {
      type: 'festival',
      title: '대전 유성구 문화축제',
      date: '2025년 9월 예정',
      location: '대전 유성구',
      emoji: '🎪',
      url: 'https://korean.visitkorea.or.kr/kfes/list/wntyFstvlList.do'
    },
    {
      type: 'festival',
      title: '충청남도 꽃 축제',
      date: '2025년 10월 예정',
      location: '충청남도',
      emoji: '🌸',
      url: 'https://korean.visitkorea.or.kr/kfes/list/wntyFstvlList.do'
    }
  ]

  // 날씨 정보 가져오기 (간단한 예시 - 실제로는 API 사용)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // OpenWeatherMap API 사용 예시 (API 키 필요)
        // const apiKey = import.meta.env.VITE_WEATHER_API_KEY
        // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Daejeon,kr&appid=${apiKey}&units=metric&lang=kr`)
        // const data = await response.json()
        
        // 일단 하드코딩된 날씨 정보 (나중에 API로 교체 가능)
        setWeather({
          type: 'weather',
          temp: 15,
          description: '맑음',
          emoji: '☀️',
          url: 'https://weather.naver.com/today/1111060000' // 대전 날씨
        })
      } catch (err) {
        console.error('날씨 정보 가져오기 실패:', err)
        // 기본 날씨 정보
        setWeather({
          type: 'weather',
          temp: 15,
          description: '맑음',
          emoji: '☀️',
          url: 'https://weather.naver.com/today/1111060000' // 대전 날씨
        })
      }
    }

    fetchWeather()
  }, [])

  // 10초마다 정보 전환
  useEffect(() => {
    const items = weather ? [weather, ...festivals] : festivals
    
    if (items.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, 10000) // 10초

    return () => clearInterval(interval)
  }, [weather, festivals.length])

  const items = weather ? [weather, ...festivals] : festivals
  const currentItem = items[currentIndex]

  if (!currentItem) {
    return (
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">📰 대전 충청 소식</span>
              <span className="text-sm text-white/80">(준비 중)</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleItemClick = () => {
    if (currentItem.url) {
      window.open(currentItem.url, '_blank')
    }
  }

  const handleIndicatorClick = (index) => {
    setCurrentIndex(index)
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-5">
          <div 
            onClick={handleItemClick}
            className={`flex items-center justify-between ${currentItem.url ? 'cursor-pointer hover:opacity-90 transition' : ''}`}
          >
            <div className="flex items-center gap-4 flex-1">
              <span className="text-4xl">{currentItem.type === 'weather' ? currentItem.emoji : currentItem.emoji}</span>
              <div className="flex-1">
                {currentItem.type === 'weather' ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl font-bold">대전 날씨</span>
                    </div>
                    <div className="text-base text-white/90">
                      {currentItem.temp}°C • {currentItem.description}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl font-bold">{currentItem.title}</span>
                    </div>
                    <div className="text-base text-white/90">
                      {currentItem.date} • {currentItem.location}
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* 인디케이터 */}
            <div className="flex items-center gap-2 ml-4">
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleIndicatorClick(index)
                  }}
                  className={`w-3 h-3 rounded-full transition ${
                    index === currentIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`${index + 1}번째 항목으로 이동`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegionNewsBanner

