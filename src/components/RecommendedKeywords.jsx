function RecommendedKeywords() {
  const keywords = [
    { label: '겨울', emoji: '❄️' },
    { label: '먹거리', emoji: '🍽️' },
    { label: '힐링', emoji: '🌿' },
    { label: '불꽃놀이', emoji: '🎆' },
    { label: '연인과함께', emoji: '💑' },
    { label: '문화예술', emoji: '🎨' }
  ]

  return (
    <div className="bg-white py-8">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">추천 축제 키워드</h2>
        <div className="flex flex-wrap gap-3">
          {keywords.map((keyword, index) => (
            <button
              key={index}
              className="px-4 py-2 bg-gray-100 hover:bg-blue-500 hover:text-white rounded-full text-sm font-medium transition"
            >
              #{keyword.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RecommendedKeywords

