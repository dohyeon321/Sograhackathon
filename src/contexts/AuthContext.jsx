import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebase/config'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  // 회원가입
  async function signup(email, password, displayName, region, isLocal = false) {
    try {
      // Firebase 설정 확인
      if (!isFirebaseConfigured) {
        return {
          success: false,
          error: 'Firebase가 설정되지 않았습니다. .env 파일에 Firebase 설정을 추가해주세요.'
        }
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('올바른 이메일 형식이 아닙니다.')
      }

      // 비밀번호 검증 (최소 8자, 영문+숫자+특수문자)
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/
      if (!passwordRegex.test(password)) {
        throw new Error('비밀번호는 최소 8자 이상이며, 영문, 숫자, 특수문자를 포함해야 합니다.')
      }

      // Firebase Auth 초기화 확인
      if (!auth) {
        return {
          success: false,
          error: 'Firebase가 초기화되지 않았습니다. 서버를 재시작해주세요.'
        }
      }

      // Firebase Auth로 사용자 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 프로필 업데이트
      await updateProfile(user, {
        displayName: displayName
      })

      // 이메일 인증 링크 전송
      try {
        await sendEmailVerification(user, {
          url: window.location.origin, // 인증 후 리다이렉트 URL
          handleCodeInApp: false // 이메일 링크로 직접 인증
        })
      } catch (emailError) {
        console.error('이메일 인증 링크 전송 실패:', emailError)
        // 이메일 전송 실패해도 계정은 생성됨
      }

      // Firestore에 임시 사용자 정보 저장 (이메일 인증 완료 전까지)
      // 로그아웃 전에 저장해야 권한이 있음
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        region: region,
        isLocal: isLocal,
        emailVerified: false, // 이메일 인증 상태
        signupCompleted: false, // 회원가입 완료 여부 (이메일 인증 완료 시 true)
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      try {
        await setDoc(doc(db, 'users', user.uid), userData)
      } catch (firestoreError) {
        console.error('Firestore 저장 실패:', firestoreError)
        // Firestore 저장 실패해도 계정은 생성되었으므로 계속 진행
        // 이메일 인증 완료 후 다시 저장 시도
      }

      // 회원가입 후 즉시 로그아웃 (이메일 인증 완료 전까지 로그인 방지)
      await signOut(auth)

      return { success: true, emailSent: true }
    } catch (error) {
      console.error('회원가입 에러:', error)
      let errorMessage = '회원가입 중 오류가 발생했습니다.'

      if (error.code === 'auth/email-already-in-use') {
        // 이메일이 이미 사용 중인 경우, 이메일 인증 완료 여부 확인
        // 인증되지 않은 계정이면 안내 메시지 표시
        errorMessage = '이미 사용 중인 이메일입니다. 이메일 인증을 완료하지 않은 경우 이메일을 확인하여 인증을 완료해주세요.'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '올바른 이메일 형식이 아닙니다.'
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'Firebase Authentication이 활성화되지 않았습니다. Firebase Console에서 Authentication을 활성화해주세요.'
      } else if (error.message) {
        errorMessage = error.message
      }

      return { success: false, error: errorMessage }
    }
  }

  // 로그인
  async function login(email, password) {
    try {
      // Firebase 설정 확인
      if (!isFirebaseConfigured) {
        return {
          success: false,
          error: 'Firebase가 설정되지 않았습니다. .env 파일에 Firebase 설정을 추가해주세요.'
        }
      }

      // Firebase Auth 초기화 확인
      if (!auth) {
        return {
          success: false,
          error: 'Firebase가 초기화되지 않았습니다. 서버를 재시작해주세요.'
        }
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 이메일 인증이 완료되지 않은 경우 로그인 불가
      if (!user.emailVerified) {
        await signOut(auth)
        return {
          success: false,
          error: '이메일 인증이 완료되지 않았습니다. 이메일을 확인하여 인증을 완료해주세요.'
        }
      }

      return { success: true, user: user }
    } catch (error) {
      console.error('로그인 에러:', error)
      let errorMessage = '로그인 중 오류가 발생했습니다.'

      if (error.code === 'auth/user-not-found') {
        errorMessage = '등록되지 않은 이메일입니다.'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 올바르지 않습니다.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '올바른 이메일 형식이 아닙니다.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 시도가 있었습니다. 나중에 다시 시도해주세요.'
      }

      return { success: false, error: errorMessage }
    }
  }

  // 로그아웃
  async function logout() {
    try {
      if (!auth) {
        return { success: false, error: 'Firebase가 초기화되지 않았습니다.' }
      }
      await signOut(auth)
      setUserData(null)
      return { success: true }
    } catch (error) {
      console.error('로그아웃 에러:', error)
      return { success: false, error: '로그아웃 중 오류가 발생했습니다.' }
    }
  }

  // 사용자 데이터 가져오기
  async function fetchUserData(uid) {
    try {
      if (!db) {
        return null
      }

      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        return userDoc.data()
      }
      return null
    } catch (error) {
      // 오프라인 에러는 조용히 무시 (정상적인 상황)
      if (error.code === 'unavailable' || error.code === 'failed-precondition' || error.message?.includes('offline')) {
        // 오프라인 상태는 정상이므로 경고 없이 처리
        return null
      }
      // 다른 에러만 로그 출력
      if (error.code !== 'permission-denied') {
        if (import.meta.env.DEV) {
          console.error('사용자 데이터 가져오기 에러:', error)
        }
      }
      return null
    }
  }

  // 사용자 데이터 새로고침 (로컬 인증 등 업데이트 후 사용)
  async function refreshUserData() {
    if (!currentUser) {
      return
    }

    try {
      const data = await fetchUserData(currentUser.uid)
      if (data) {
        setUserData(data)
      } else {
        // Fallback — Firestore 데이터 없으면 최소 기본정보
        setUserData({
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || '사용자',
          email: currentUser.email,
          region: '',
          isLocal: false,
        })
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('사용자 데이터 새로고침 실패:', e)
      }
    }
  }

  // 이메일 인증 링크 재전송
  async function resendEmailVerification(email, password) {
    try {
      if (!auth) {
        return { success: false, error: 'Firebase가 초기화되지 않았습니다.' }
      }

      // 임시 로그인하여 인증 링크 전송
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 이미 인증된 경우
      if (user.emailVerified) {
        await signOut(auth)
        return { success: false, error: '이미 인증된 이메일입니다.' }
      }

      // 이메일 인증 링크 전송
      await sendEmailVerification(user, {
        url: window.location.origin,
        handleCodeInApp: false
      })

      // 로그아웃
      await signOut(auth)

      return { success: true }
    } catch (error) {
      console.error('이메일 인증 링크 재전송 에러:', error)
      let errorMessage = '이메일 인증 링크 재전송 중 오류가 발생했습니다.'

      if (error.code === 'auth/user-not-found') {
        errorMessage = '등록되지 않은 이메일입니다.'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 올바르지 않습니다.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.'
      }

      return { success: false, error: errorMessage }
    }
  }

  // 인증 상태 변경 감지
  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)

      if (user) {
        // 이메일 인증이 완료되었는지 확인
        if (user.emailVerified) {
          // 이메일 인증 완료 - Firestore에서 사용자 정보 확인
          let data = null
          try {
            data = await fetchUserData(user.uid)
          } catch (e) {
            console.warn('fetchUserData 실패:', e)
          }

          // 이메일 인증이 완료되었지만 회원가입이 완료되지 않은 경우
          if (data && !data.signupCompleted) {
            // 회원가입 완료 처리
            try {
              await setDoc(doc(db, 'users', user.uid), {
                ...data,
                emailVerified: true,
                signupCompleted: true,
                updatedAt: serverTimestamp()
              }, { merge: true })
              
              // 사용자 데이터 새로고침
              data = await fetchUserData(user.uid)
              
              // 회원가입 완료 후 자동 로그아웃하여 로그인 화면으로 이동
              // 약간의 지연을 두어 사용자에게 완료 메시지를 볼 수 있게 함
              setTimeout(async () => {
                await signOut(auth)
                setUserData(null)
                setCurrentUser(null)
              }, 2000) // 2초 후 로그아웃
            } catch (e) {
              console.error('회원가입 완료 처리 실패:', e)
            }
          }

          if (!data) {
            // Fallback — Firestore 데이터 없으면 최소 기본정보
            data = {
              displayName: user.displayName || user.email?.split('@')[0] || '사용자',
              email: user.email,
              region: '',
              isLocal: false,
            }
          }

          setUserData(data)
        } else {
          // 이메일 인증이 완료되지 않은 경우 - 로그인 불가
          // 로그아웃 처리
          try {
            await signOut(auth)
            setUserData(null)
            setCurrentUser(null)
          } catch (e) {
            console.error('로그아웃 실패:', e)
          }
        }
      } else {
        // user가 null인 경우 (로그아웃 상태)
        setUserData(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [auth])


  const value = {
    currentUser,
    userData,
    signup,
    login,
    logout,
    refreshUserData,
    resendEmailVerification,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

