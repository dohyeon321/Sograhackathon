import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../../contexts/AuthContext'

const ATTEMPT_KEY = 'auth:loginAttempts' // sessionStorage key

function getAttempts() {
  try {
    const raw = sessionStorage.getItem(ATTEMPT_KEY)
    return raw ? JSON.parse(raw) : { count: 0, lockUntil: 0 }
  } catch {
    return { count: 0, lockUntil: 0 }
  }
}
function saveAttempts(obj) {
  sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(obj))
}

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
  const [disabledUntil, setDisabledUntil] = useState(0) // short throttle
  const { login } = useAuth()
  const honeypotRef = useRef(null)

  // initialEmail이 변경되면 이메일 업데이트 (문자열인 경우만)
  useEffect(() => {
    if (typeof initialEmail === 'string' && initialEmail.trim() !== '') {
      setEmail(initialEmail)
    } else {
      setEmail('')
    }
  }, [initialEmail])

  useEffect(() => {
    const attempts = getAttempts()
    if (attempts.lockUntil && Date.now() < attempts.lockUntil) {
      setError(`잠시 후 다시 시도해주세요. (${Math.ceil((attempts.lockUntil - Date.now())/1000)}초)`)
    }
  }, [])

  const recordFailure = () => {
    const at = getAttempts()
    at.count = (at.count || 0) + 1

    // threshold에서 잠금 적용: threshold = 5
    const threshold = 5
    if (at.count >= threshold) {
      // 지수 백오프: 기본 60초, 2^(count-threshold) 배
      const exponent = Math.max(0, at.count - threshold)
      const lockSec = 60 * Math.pow(2, exponent) // 60s, 120s, 240s...
      at.lockUntil = Date.now() + lockSec * 1000
      setError(`시도 횟수가 많습니다. ${Math.ceil(lockSec)}초 동안 잠깁니다.`)
    }
    saveAttempts(at)
  }

  const clearAttempts = () => {
    saveAttempts({ count: 0, lockUntil: 0 })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 허니팟 검사: 봇이면 차단
    if (honeypotRef.current && honeypotRef.current.value) {
      setError('의심스러운 요청입니다.')
      return
    }

    const attempts = getAttempts()
    if (attempts.lockUntil && Date.now() < attempts.lockUntil) {
      setError(`너무 많은 시도. 잠시 후 다시 시도하세요.`)
      return
    }

    if (Date.now() < disabledUntil) {
      setError('잠시 후 다시 시도하세요.')
      return
    }

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setLoading(true)
    setDisabledUntil(Date.now() + 1500) // 1.5초 스로틀(빠른 연속 클릭 방지)

    try {
      const result = await login(email, password)

      if (result.success) {
        clearAttempts()
        setEmail('')
        setPassword('')
        setError('')
        onClose()
      } else {
        recordFailure()
        setError(result.error || '로그인에 실패했습니다.')
      }
    } catch (err) {
      console.error('로그인 에러:', err)
      recordFailure()
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 허니팟(사실상 사용자에게 보이지 않도록 숨김) */}
      <div style={{ position: 'absolute', left: '-9999px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" ref={honeypotRef} tabIndex="-1" autoComplete="off" />
      </div>

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
          autoComplete="email"
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
          autoComplete="current-password"
        />
      </div>

      <button
        type="submit"
        disabled={loading || Date.now() < disabledUntil}
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
