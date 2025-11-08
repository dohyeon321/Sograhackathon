// Firebase 설정 파일
// 실제 사용 시 환경 변수로 관리하세요

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Firebase 설정 (실제 프로젝트의 설정으로 교체하세요)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCw78LmFKTfoXy9aRPtQEimpHqft-6kdt8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sograkkp-b75b9.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sograkkp-b75b9",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sograkkp-b75b9.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "12942565193",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:12942565193:web:73e2849f8bc84663548498",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-J8WJWF8CW0"
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
    console.log('Firebase 초기화 성공')
  } catch (error) {
    console.error('Firebase 초기화 에러:', error)
  }
} else {
  console.warn('Firebase 설정이 완료되지 않았습니다. .env 파일을 확인하세요.')
}

export { auth, db, storage, isFirebaseConfigured }
export default app

