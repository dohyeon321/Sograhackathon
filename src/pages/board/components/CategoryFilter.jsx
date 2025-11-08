function CategoryFilter({ selectedCategory, setSelectedCategory }) {
  const categories = [
    { id: 'all', label: '전체', emoji: '' },
    { id: '맛집', label: '맛집', emoji: '🍽️' },
    { id: '교통', label: '교통', emoji: '🚗' },
    { id: '핫플', label: '핫플', emoji: '🎉' },
    { id: '꿀팁', label: '꿀팁', emoji: '💡' }
  ]

  const localFilter = { id: 'local', label: '로컬인증', emoji: '🏡' }

  return (
    <div className="bg-white border-b border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-2 overflow-x-auto items-center">
          {/* 일반 카테고리 필터 */}
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.emoji} {category.label}
              </button>
            ))}
          </div>
          
          {/* 구분선 */}
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          
          {/* 로컬인증 필터 (오른쪽 분리) */}
          <button
            onClick={() => setSelectedCategory(localFilter.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              selectedCategory === localFilter.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {localFilter.emoji} {localFilter.label}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CategoryFilter

