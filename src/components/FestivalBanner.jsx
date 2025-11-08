import { useState } from 'react'

function FestivalBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const slides = [
    {
      title: '맛있는 축제 한 입!',
      subtitle: '먹거리 알리오 캠페인',
      emoji: '🍜',
      bgColor: 'bg-purple-100'
    }
  ]

  return (
    <div className="relative bg-gradient-to-r from-purple-100 to-pink-100 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-white/80 backdrop-blur-sm rounded-lg p-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  테마
                </span>
                <h2 className="text-3xl font-bold text-gray-800">
                  {slides[currentSlide].title}
                </h2>
              </div>
              <p className="text-lg text-gray-600 mb-4">
                {slides[currentSlide].subtitle}
              </p>
              <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition">
                알아보기
              </button>
            </div>
            <div className="hidden md:flex items-center gap-4 text-6xl">
              <span>{slides[currentSlide].emoji}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{currentSlide + 1}/4</span>
              <button className="p-1 hover:bg-gray-200 rounded">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1))}
                className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition"
              >
                ←
              </button>
              <button 
                onClick={() => setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : 0))}
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

