# Firebase Authentication 설정 방법

## 🔴 현재 에러: `auth/configuration-not-found`

이 에러는 Firebase Console에서 **Authentication이 활성화되지 않았을 때** 발생합니다.

## 해결 방법

### 1단계: Firebase Console 접속
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 **sograkkp** 선택

### 2단계: Authentication 활성화
1. 왼쪽 메뉴에서 **Authentication** 클릭
2. **시작하기** 버튼 클릭
3. Authentication이 활성화됩니다

### 3단계: 이메일/비밀번호 로그인 방법 활성화
1. Authentication 페이지에서 **Sign-in method** 탭 클릭
2. **이메일/비밀번호** 클릭
3. **사용 설정** 토글을 **ON**으로 변경
4. **저장** 버튼 클릭

### 4단계: 확인
- 이제 회원가입과 로그인이 정상적으로 작동합니다!

## 추가 설정 (선택사항)

### Firestore Database 생성
1. 왼쪽 메뉴에서 **Firestore Database** 클릭
2. **데이터베이스 만들기** 클릭
3. **테스트 모드로 시작** 선택
4. 위치 선택 (asia-northeast3 - 서울 권장)
5. **사용 설정** 클릭

### Firestore 보안 규칙 설정
1. Firestore Database → **규칙** 탭
2. `firestore.rules` 파일 내용 복사하여 붙여넣기
3. **게시** 클릭

