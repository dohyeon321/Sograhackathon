import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function RegionNewsBanner() {
  const [currentIndex, setCurrentIndex] = useState(0)

  // ✅ 지역 축제 정보 (이미지 포함)
  const festivals = [
    {
      title: '2025 대전 0시 축제',
      date: '2025년 8월 8일 ~ 16일',
      location: '대전 중구 중앙로 일원',
      emoji: '🎉',
      img: '/img/festival1.jpg',
      url: 'https://korean.visitkorea.or.kr/kfes/list/wntyFstvlList.do'
    },
    {
      title: '대전 유성구 문화축제',
      date: '2025년 9월 예정',
      location: '대전 유성구',
      emoji: '🎪',
      img: '/img/festival2.jpg',
      url: 'https://korean.visitkorea.or.kr/kfes/list/wntyFstvlList.do'
    },
    {
      title: '충청남도 꽃 축제',
      date: '2025년 10월 예정',
      location: '충청남도',
      emoji: '🌸',
      img: '/img/festival3.jpg',
      url: 'https://korean.visitkorea.or.kr/kfes/list/wntyFstvlList.do'
    }
  ]

  // ✅ 10초마다 자동 전환
  useEffect(() => {
    if (festivals.length === 0) return
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % festivals.length)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const currentItem = festivals[currentIndex]

  const handleClick = () => {
    if (currentItem.url) window.open(currentItem.url, '_blank')
  }

  return (
    <div className="relative h-[260px] md:h-[320px] lg:h-[380px] overflow-hidden rounded-none">
      {/* ✅ 배경 이미지 전환 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {currentItem.img ? (
            <img
              src={currentItem.img}
              alt={currentItem.title}
              className="absolute inset-0 w-full h-full object-cover brightness-[0.6]"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ✅ 내용 영역 */}
      <div
        onClick={handleClick}
        className={`relative z-10 h-full flex flex-col justify-center px-8 max-w-7xl mx-auto text-white ${
          currentItem.url ? 'cursor-pointer hover:opacity-90 transition' : ''
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-5xl">{currentItem.emoji}</span>
          <span className="text-2xl md:text-3xl font-extrabold drop-shadow-lg">
            {currentItem.title}
          </span>
        </div>
        <p className="text-lg text-white/90">
          {currentItem.date} • {currentItem.location}
        </p>

        {/* ✅ 인디케이터 */}
        <div className="absolute bottom-4 right-6 flex items-center gap-2">
          {festivals.map((_, index) => (
            <button
              key={index}
              onClick={e => {
                e.stopPropagation()
                setCurrentIndex(index)
              }}
              className={`w-3 h-3 rounded-full transition ${
                index === currentIndex
                  ? 'bg-white'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`${index + 1}번째 축제로 이동`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default RegionNewsBanner
