function TabNavigation({ activeTab, setActiveTab }) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('board')}
            className={`py-4 px-2 font-medium transition ${
              activeTab === 'board'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            게시판
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`py-4 px-2 font-medium transition ${
              activeTab === 'map'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            지도보기
          </button>
          <button
            onClick={() => setActiveTab('daejeonChungcheong')}
            className={`py-4 px-2 font-medium transition ${
              activeTab === 'daejeonChungcheong'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            찐명소
          </button>
        </div>
      </div>
    </nav>
  )
}

export default TabNavigation

