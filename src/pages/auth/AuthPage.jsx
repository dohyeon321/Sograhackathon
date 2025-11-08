import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import LoginForm from './components/LoginForm'
import SignupForm from './components/SignupForm'

function AuthPage({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode) // 'login' or 'signup' or 'signupCompleted'
  const [signupEmail, setSignupEmail] = useState('') // 회원가입 시 입력한 이메일

  // initialMode가 변경되면 mode 업데이트
  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  if (!isOpen) return null

  const handleSwitchToLogin = (email = '') => {
    setSignupEmail(email)
    setMode('login')
  }

  const handleSwitchToSignup = () => {
    setSignupEmail('')
    setMode('signup')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {mode === 'signup' ? '회원가입' : mode === 'signupCompleted' ? '회원가입 완료' : '로그인'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {mode === 'signupCompleted' ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
                <div className="font-semibold mb-2">✅ 회원가입이 완료되었습니다!</div>
                <div className="text-sm">
                  <p className="mb-2">
                    이메일 인증이 완료되어 회원가입이 성공적으로 완료되었습니다.
                  </p>
                  <p className="mb-2">
                    이제 로그인하여 서비스를 이용하실 수 있습니다.
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setMode('login')
                  setSignupEmail('')
                }}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition"
              >
                로그인하기
              </button>
            </div>
          ) : mode === 'signup' ? (
            <SignupForm onClose={onClose} onSwitchToLogin={handleSwitchToLogin} />
          ) : (
            <LoginForm onClose={onClose} onSwitchToSignup={handleSwitchToSignup} initialEmail={signupEmail} />
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthPage

