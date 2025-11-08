// Firebase 설정 파일
// 실제 사용 시 환경 변수로 관리하세요

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Firebase 설정 - 프로덕션에서는 환경 변수 필수
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// 개발 환경에서만 기본값 제공 (프로덕션에서는 환경 변수 필수)
if (import.meta.env.DEV && !firebaseConfig.apiKey) {
  console.warn('⚠️ 개발 모드: .env 파일에 Firebase 설정을 추가하세요.')
  // 개발 환경에서만 기본값 사용
  Object.assign(firebaseConfig, {
    apiKey: "AIzaSyCw78LmFKTfoXy9aRPtQEimpHqft-6kdt8",
    authDomain: "sograkkp-b75b9.firebaseapp.com",
    projectId: "sograkkp-b75b9",
    storageBucket: "sograkkp-b75b9.firebasestorage.app",
    messagingSenderId: "12942565193",
    appId: "1:12942565193:web:73e2849f8bc84663548498",
    measurementId: "G-J8WJWF8CW0"
  })
}

// Firebase 설정 확인
const isFirebaseConfigured = 
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "your-api-key" &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== "your-project-id" &&
  firebaseConfig.authDomain &&
  firebaseConfig.authDomain !== "your-project.firebaseapp.com"

// 디버깅: 환경 변수 로드 확인
if (import.meta.env.DEV) {
  console.log('Firebase 설정 확인:', {
    apiKey: firebaseConfig.apiKey ? '설정됨' : '설정 안됨',
    projectId: firebaseConfig.projectId,
    isConfigured: isFirebaseConfigured
  })
}

// Firebase 초기화
let app = null
let auth = null
let db = null
let storage = null

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
    
    // Firestore 오프라인 지속성 활성화 (오프라인에서도 작동)
    if (typeof window !== 'undefined') {
      enableIndexedDbPersistence(db).catch((err) => {
        if (import.meta.env.DEV) {
          if (err.code === 'failed-precondition') {
            console.warn('Firestore 지속성 활성화 실패: 여러 탭이 열려있을 수 있습니다.')
          } else if (err.code === 'unimplemented') {
            console.warn('Firestore 지속성 미지원: 브라우저가 지원하지 않습니다.')
          }
        }
      })
    }
    
    if (import.meta.env.DEV) {
      console.log('Firebase 초기화 성공')
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Firebase 초기화 에러:', error)
    }
  }
} else {
  if (import.meta.env.DEV) {
    console.warn('Firebase 설정이 완료되지 않았습니다. .env 파일을 확인하세요.')
  }
}

export { auth, db, storage, isFirebaseConfigured }
export default app

