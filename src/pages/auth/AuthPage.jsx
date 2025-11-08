import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import LoginForm from './components/LoginForm'
import SignupForm from './components/SignupForm'

function AuthPage({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode) // 'login' or 'signup'
  const [signupEmail, setSignupEmail] = useState('') // 회원가입 시 입력한 이메일

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
              {mode === 'signup' ? '회원가입' : '로그인'}
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

          {mode === 'signup' ? (
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

