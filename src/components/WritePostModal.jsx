import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

const CATEGORIES = [
  { id: '맛집', label: '맛집', emoji: '🍽️' },
  { id: '꿀팁', label: '꿀팁', emoji: '💡' },
  { id: '핫플', label: '핫플', emoji: '🎉' },
  { id: '관광', label: '관광', emoji: '🏛️' },
  { id: '교통', label: '교통', emoji: '🚗' }
]

function WritePostModal({ isOpen, onClose, onSuccess }) {
  const { currentUser, userData } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    location: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  if (!currentUser) {
    return null
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 입력 검증
    if (!formData.title || formData.title.trim().length < 2) {
      setError('제목은 최소 2자 이상이어야 합니다.')
      return
    }

    if (!formData.content || formData.content.trim().length < 10) {
      setError('내용은 최소 10자 이상이어야 합니다.')
      return
    }

    if (!formData.category) {
      setError('카테고리를 선택해주세요.')
      return
    }

    if (!formData.location || formData.location.trim().length < 2) {
      setError('위치를 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      // Firestore에 게시물 저장
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        location: formData.location.trim(),
        authorId: currentUser.uid,
        authorName: userData?.displayName || currentUser.email,
        authorRegion: userData?.region || '',
        likes: 0,
        comments: 0,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      await addDoc(collection(db, 'posts'), postData)

      // 폼 초기화
      setFormData({
        title: '',
        content: '',
        category: '',
        location: ''
      })

      if (onSuccess) {
        onSuccess()
      }
      
      onClose()
    } catch (error) {
      console.error('게시물 작성 에러:', error)
      setError('게시물 작성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">게시물 작성</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleChange({ target: { name: 'category', value: cat.id } })}
                    className={`px-3 py-2 rounded-lg border-2 transition ${
                      formData.category === cat.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg">{cat.emoji}</div>
                    <div className="text-xs mt-1">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="제목을 입력하세요"
                maxLength={100}
                required
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                위치 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 대전 중구 은행동"
                required
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="내용을 입력하세요 (최소 10자 이상)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.content.length}자 / 최소 10자 이상
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '작성 중...' : '작성하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default WritePostModal

