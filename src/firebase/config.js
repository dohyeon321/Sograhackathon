// Firebase 설정 파일
// 실제 사용 시 환경 변수로 관리하세요

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Firebase 설정 - 환경 변수 필수
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// 프로덕션 환경에서 환경 변수 확인 (필수)
if (import.meta.env.PROD && !firebaseConfig.apiKey) {
  console.error('❌ 프로덕션 환경: Firebase API 키가 설정되지 않았습니다. .env 파일을 확인하세요.')
  throw new Error('Firebase 설정이 필요합니다. .env 파일에 VITE_FIREBASE_API_KEY를 설정하세요.')
}

// 개발 환경에서 환경 변수 확인 (경고만 표시, 기본값 사용 가능)
if (import.meta.env.DEV && !firebaseConfig.apiKey) {
  console.warn('⚠️ 개발 환경: Firebase API 키가 설정되지 않았습니다.')
  console.warn('📝 보안을 위해 .env.example 파일을 참고하여 .env 파일을 생성하고 Firebase 설정을 추가하세요.')
  console.warn('📝 현재는 기본값을 사용합니다. 프로덕션 배포 전에는 반드시 환경 변수를 설정하세요.')
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

