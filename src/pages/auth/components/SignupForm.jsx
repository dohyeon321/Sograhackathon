import { useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'

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
  const [resending, setResending] = useState(false) // 재전송 중 여부
  const [emailSent, setEmailSent] = useState(false) // 이메일 인증 링크 전송 완료 여부
  const { signup, logout, resendEmailVerification } = useAuth()
  const [isLocalVerified, setIsLocalVerified] = useState(false)


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
        formData.region,
        isLocalVerified
      )

      if (result.success) {
        // 이메일 인증 링크 전송 완료
        if (result.emailSent) {
          setEmailSent(true)
          // 이메일은 유지
          const signupEmail = formData.email
          
          // 폼 초기화 (이메일 제외)
          setFormData({
            displayName: '',
            email: signupEmail, // 이메일은 유지
            password: '',
            confirmPassword: '',
            region: ''
          })
          setIsLocalVerified(false)
        } else {
          // 이메일 전송 실패한 경우 기존 로직
          const signupEmail = formData.email
          setFormData({
            displayName: '',
            email: '',
            password: '',
            confirmPassword: '',
            region: ''
          })
          setIsLocalVerified(false)
          await logout()
          onSwitchToLogin(signupEmail)
        }
      } else {
        // Firestore 권한 오류인 경우 이메일 인증 안내로 변경
        if (result.error && result.error.includes('Missing or insufficient permissions')) {
          // 이메일 인증 링크는 전송되었을 수 있으므로 이메일 인증 화면으로 이동
          setEmailSent(true)
          const signupEmail = formData.email
          setFormData({
            displayName: '',
            email: signupEmail, // 이메일은 유지
            password: '',
            confirmPassword: '',
            region: ''
          })
          setIsLocalVerified(false)
        } else {
          setError(result.error)
        }
      }
    } catch (error) {
      console.error('회원가입 처리 중 에러:', error)
      setError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 이메일 인증 링크 전송 완료 화면
  if (emailSent) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border-2 border-yellow-400 text-yellow-800 px-4 py-4 rounded-lg">
          <div className="font-bold text-lg mb-3 flex items-center gap-2">
            <span className="text-2xl">📧</span>
            <span>이메일 인증이 필요합니다</span>
          </div>
          <div className="text-sm space-y-2">
            <p className="font-semibold">
              <strong className="text-yellow-900">{formData.email}</strong>로 인증 링크를 전송했습니다.
            </p>
            <div className="bg-yellow-100 p-3 rounded border border-yellow-300">
              <p className="font-bold text-yellow-900 mb-1">⚠️ 중요:</p>
              <p className="text-yellow-800">
                이메일을 확인하여 인증 링크를 클릭해야 <strong>회원가입이 완료</strong>됩니다.
              </p>
            </div>
            <p className="text-xs text-yellow-700 mt-2">
              💡 이메일이 보이지 않으면 스팸 폴더를 확인해주세요.
            </p>
            <p className="text-xs text-yellow-700">
              ⏰ 인증 링크는 1시간 후 만료됩니다.
            </p>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          <p className="font-semibold">
            ⚠️ 이메일 인증을 완료하지 않으면 로그인할 수 없습니다.
          </p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={async () => {
              setResending(true)
              setError('')
              
              // 비밀번호를 다시 입력받아야 재전송 가능
              const password = prompt('이메일 인증 링크를 재전송하려면 비밀번호를 입력해주세요:')
              if (!password) {
                setResending(false)
                return
              }

              const result = await resendEmailVerification(formData.email, password)
              if (result.success) {
                alert('이메일 인증 링크를 재전송했습니다. 이메일을 확인해주세요.')
              } else {
                setError(result.error)
              }
              setResending(false)
            }}
            disabled={resending}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? '재전송 중...' : '인증 링크 재전송'}
          </button>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEmailSent(false)
                setFormData({
                  displayName: '',
                  email: formData.email, // 이메일 유지
                  password: '',
                  confirmPassword: '',
                  region: ''
                })
              }}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              다시 시도
            </button>
            <button
              type="button"
              onClick={() => onSwitchToLogin(formData.email)}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition"
            >
              로그인으로 이동
            </button>
          </div>
        </div>
      </div>
    )
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
      {/* ✅ 로컬 인증 버튼 추가 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (!navigator.geolocation) {
              alert('이 브라우저에서는 위치 정보 기능을 지원하지 않습니다.')
              return
            }

            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const { latitude, longitude } = pos.coords
                console.log('현재 좌표:', latitude, longitude)

                if (latitude > 35.8 && latitude < 37.2 && longitude > 126.5 && longitude < 128.3) {
                  alert('로컬 인증 성공! 🎉 대전·충청 지역이 확인되었습니다.')
                  setIsLocalVerified(true)
                } else {
                  alert('현재 위치가 대전·충청 지역이 아닙니다.')
                  setIsLocalVerified(false)
                }
              },
              (err) => {
                console.error('위치 정보 접근 실패:', err)
                alert('위치 정보 접근이 거부되었습니다.')
                setIsLocalVerified(false)
              }
            )
          }}
          className="bg-gray-200 hover:bg-gray-300 text-sm px-3 py-2 rounded"
        >
          로컬 인증하기
        </button>

        {isLocalVerified ? (
          <span className="text-green-600 text-sm font-medium">✔ 로컬 인증 완료</span>
        ) : (
          <span className="text-gray-400 text-sm">미인증</span>
        )}
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

