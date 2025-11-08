import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'

function LoginForm({ onClose, onSwitchToSignup, initialEmail = '' }) {
  // initialEmail이 문자열인지 확인하고, 객체가 아닌지 체크
  const getInitialEmail = () => {
    if (typeof initialEmail === 'string' && initialEmail.trim() !== '') {
      return initialEmail
    }
    return ''
  }
  
  const [email, setEmail] = useState(getInitialEmail())
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  // initialEmail이 변경되면 이메일 업데이트 (문자열인 경우만)
  useEffect(() => {
    if (typeof initialEmail === 'string' && initialEmail.trim() !== '') {
      setEmail(initialEmail)
    } else {
      setEmail('')
    }
  }, [initialEmail])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 입력 검증
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      setLoading(false)
      return
    }

    try {
      const result = await login(email, password)
      
      if (result.success) {
        setEmail('')
        setPassword('')
        setError('')
        onClose() // 로그인 성공 시 모달 닫기
      } else {
        setError(result.error || '로그인에 실패했습니다.')
      }
    } catch (err) {
      console.error('로그인 에러:', err)
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          이메일
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="example@email.com"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          비밀번호
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="비밀번호를 입력하세요"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>

      <div className="text-center text-sm text-gray-600">
        계정이 없으신가요?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-blue-500 hover:text-blue-600 font-medium"
        >
          회원가입
        </button>
      </div>
    </form>
  )
}

export default LoginForm

