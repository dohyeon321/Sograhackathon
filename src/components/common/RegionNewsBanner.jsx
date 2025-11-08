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
      <section className="px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[30px] border border-white/60 bg-white/70 px-8 py-10 text-slate-600 shadow-[0_30px_60px_-45px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="flex items-center gap-3 text-lg font-semibold">
              <span className="text-2xl">📰</span>
              <span>대전 충청 소식이 곧 업데이트될 예정입니다.</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">생생한 지역 축제와 날씨 소식을 준비하고 있어요.</p>
          </div>
        </div>
      </section>
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
    <section className="px-6">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/75 px-8 py-9 text-slate-800 shadow-[0_38px_65px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div className="pointer-events-none absolute -top-28 right-0 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-20 h-64 w-64 rounded-full bg-blue-200/35 blur-3xl" />

          <div
            onClick={handleItemClick}
            className={`relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between ${
              currentItem.url ? 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-200/60' : ''
            }`}
          >
            <div className="flex flex-1 items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/90 to-blue-600/90 text-4xl text-white shadow-lg">
                {currentItem.emoji}
              </div>
              <div className="flex-1">
                {currentItem.type === 'weather' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-500">
                      Weather
                      <span className="hidden rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600 sm:inline-block">
                        대전
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">대전 오늘의 하늘</h3>
                    <p className="text-lg text-slate-600">
                      {currentItem.temp}°C · {currentItem.description}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-500">
                      Festival &amp; Event
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{currentItem.title}</h3>
                    <p className="text-base text-slate-600">
                      {currentItem.date} · {currentItem.location}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 self-start rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 md:self-center">
              <span className="hidden text-xs uppercase tracking-[0.3em] text-slate-400 sm:inline-block">Now</span>
              <span className="text-slate-700">{currentIndex + 1}</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-500">{items.length}</span>
            </div>
          </div>

          <div className="relative z-10 mt-6 flex items-center gap-2">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  handleIndicatorClick(index)
                }}
                className={`h-2.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-12 bg-gradient-to-r from-sky-500 to-blue-500 shadow-sm'
                    : 'w-6 bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`${index + 1}번째 항목으로 이동`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default RegionNewsBanner

