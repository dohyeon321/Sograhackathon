import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const REGIONS = [
  '대전광역시',
  '충청남도',
  '충청북도',
  '서울특별시',
  '부산광역시',
  '인천광역시',
  '광주광역시',
  '대구광역시',
  '울산광역시',
  '경기도',
  '강원도',
  '전라남도',
  '전라북도',
  '경상남도',
  '경상북도',
  '제주특별자치도',
  '세종특별자치시'
]

function SignupForm({ onClose, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    region: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const validateForm = () => {
    if (!formData.displayName || formData.displayName.length < 2) {
      return '이름은 최소 2자 이상이어야 합니다.'
    }

    if (!formData.email) {
      return '이메일을 입력해주세요.'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return '올바른 이메일 형식이 아닙니다.'
    }

    if (!formData.password) {
      return '비밀번호를 입력해주세요.'
    }

    if (formData.password.length < 8) {
      return '비밀번호는 최소 8자 이상이어야 합니다.'
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/
    if (!passwordRegex.test(formData.password)) {
      return '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.'
    }

    if (formData.password !== formData.confirmPassword) {
      return '비밀번호가 일치하지 않습니다.'
    }

    if (!formData.region) {
      return '지역을 선택해주세요.'
    }

    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const result = await signup(
        formData.email,
        formData.password,
        formData.displayName,
        formData.region
      )

      if (result.success) {
        // 회원가입 성공 시 모달 닫기 및 폼 초기화
        setFormData({
          displayName: '',
          email: '',
          password: '',
          confirmPassword: '',
          region: ''
        })
        // 모달 닫기 - Firebase Auth가 자동으로 로그인 상태로 만들어줌
        // 약간의 지연을 주어 Auth 상태 업데이트를 기다림
        setTimeout(() => {
          onClose()
        }, 100)
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('회원가입 처리 중 에러:', error)
      setError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="displayName"
          name="displayName"
          value={formData.displayName}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="이름을 입력하세요"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          이메일 <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="example@email.com"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          비밀번호 <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="영문, 숫자, 특수문자 포함 8자 이상"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          영문, 숫자, 특수문자를 포함한 8자 이상
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          비밀번호 확인 <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="비밀번호를 다시 입력하세요"
          required
        />
      </div>

      <div>
        <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
          지역 <span className="text-red-500">*</span>
        </label>
        <select
          id="region"
          name="region"
          value={formData.region}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">지역을 선택하세요</option>
          {REGIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '가입 중...' : '회원가입'}
      </button>

      <div className="text-center text-sm text-gray-600">
        이미 계정이 있으신가요?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-500 hover:text-blue-600 font-medium"
        >
          로그인
        </button>
      </div>
    </form>
  )
}

export default SignupForm

