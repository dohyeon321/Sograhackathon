# Firebase Storage 설정 방법

## 🔴 현재 에러: CORS Policy Error

이 에러는 Firebase Storage의 CORS 설정이 되어 있지 않을 때 발생합니다.

## 해결 방법

### 1단계: Firebase Console 접속
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 **sograkkp-b75b9** 선택

### 2단계: Storage 활성화
1. 왼쪽 메뉴에서 **Storage** 클릭
2. **시작하기** 버튼 클릭
3. **테스트 모드로 시작** 선택 (또는 프로덕션 모드)
4. 위치 선택 (asia-northeast3 - 서울 권장)
5. **완료** 클릭

### 3단계: Storage 규칙 설정
1. Storage 페이지에서 **규칙** 탭 클릭
2. `storage.rules` 파일의 내용을 복사해 붙여넣기:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 게시물 이미지 규칙
    match /posts/{allPaths=**} {
      // 인증된 사용자만 업로드 가능
      allow write: if request.auth != null;
      // 모든 사용자가 읽기 가능
      allow read: if true;
    }
    
    // 사용자 프로필 이미지 규칙
    match /users/{userId}/{allPaths=**} {
      // 본인만 업로드 가능
      allow write: if request.auth != null && request.auth.uid == userId;
      // 모든 사용자가 읽기 가능
      allow read: if true;
    }
  }
}
```
3. **게시** 버튼 클릭

### 4단계: CORS 설정 (중요!)

Firebase Storage의 CORS 설정은 Firebase Console에서 직접 할 수 없습니다. 
다음 방법 중 하나를 사용하세요:

#### 방법 1: gsutil 사용 (권장)

1. [Google Cloud SDK 설치](https://cloud.google.com/sdk/docs/install)
2. 다음 명령어 실행:

```bash
gsutil cors set cors.json gs://sograkkp-b75b9.firebasestorage.app
```

3. `cors.json` 파일 생성 (프로젝트 루트에):
```json
[
  {
    "origin": ["http://localhost:5173", "https://your-domain.com"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization"]
  }
]
```

#### 방법 2: Google Cloud Console 사용

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 **sograkkp-b75b9** 선택
3. **Cloud Storage** → **브라우저** 클릭
4. 버킷 **sograkkp-b75b9.firebasestorage.app** 선택
5. **권한** 탭 → **CORS 구성** 클릭
6. CORS 설정 추가:
   - **원본**: `http://localhost:5173`, `https://your-domain.com`
   - **메서드**: `GET`, `POST`, `PUT`, `DELETE`, `HEAD`
   - **응답 헤더**: `Content-Type`, `Authorization`
   - **최대 연령**: `3600`

### 5단계: 확인
- 이제 이미지 업로드가 정상적으로 작동합니다!
- CORS 에러가 계속 발생하면 브라우저 캐시를 지우고 다시 시도하세요.

## 참고사항

- **개발 환경**: `http://localhost:5173` 추가
- **프로덕션 환경**: 실제 도메인 추가
- 이미지 업로드 실패 시에도 게시물은 저장됩니다 (이미지 없이)

