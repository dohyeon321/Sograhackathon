function CategoryFilter({ selectedCategory, setSelectedCategory }) {
  const categories = [
    { id: 'all', label: '전체', emoji: '🌐', description: '모든 이야기' },
    { id: '맛집', label: '맛집', emoji: '🍽️', description: '로컬 맛집 탐방' },
    { id: '교통', label: '교통', emoji: '🚗', description: '이동 꿀팁' },
    { id: '핫플', label: '핫플', emoji: '🎉', description: '요즘 뜨는 장소' },
    { id: '꿀팁', label: '꿀팁', emoji: '💡', description: '알짜 정보' }
  ]

  return (
    <section className="px-6 pb-4">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-white/60 bg-white/75 px-4 py-4 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-700">원하는 카테고리를 선택해보세요</h2>
            <span className="text-xs font-medium uppercase tracking-[0.45em] text-blue-500">
              Local Category
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex min-w-[150px] flex-col items-start gap-1 rounded-2xl border px-4 py-3 text-left transition-all ${
                  selectedCategory === category.id
                    ? 'border-transparent bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-[0_20px_45px_-30px_rgba(37,99,235,0.9)]'
                    : 'border-transparent bg-white/85 text-slate-600 shadow-inner hover:bg-white hover:text-blue-600'
                }`}
              >
                <span className="text-xl">{category.emoji}</span>
                <span className={`text-sm font-semibold ${selectedCategory === category.id ? 'text-white' : 'text-slate-700'}`}>
                  {category.label}
                </span>
                <span
                  className={`text-xs ${
                    selectedCategory === category.id ? 'text-white/80' : 'text-slate-400'
                  }`}
                >
                  {category.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CategoryFilter

