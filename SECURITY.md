# 보안 가이드

이 문서는 웹 애플리케이션의 보안 조치에 대해 설명합니다.

## 구현된 보안 조치

### 1. XSS (Cross-Site Scripting) 방지

**문제점:**
- 사용자가 입력한 악성 스크립트가 다른 사용자에게 실행될 수 있음
- 예: `<script>alert('XSS')</script>` 같은 코드가 게시물에 삽입됨

**해결 방법:**
1. **Content Security Policy (CSP) 헤더 추가**
   - `index.html`에 CSP 메타 태그 추가
   - 허용된 스크립트 소스만 실행 가능하도록 제한
   - Google Maps API 등 필요한 외부 리소스만 허용

2. **입력값 이스케이프 처리**
   - `sanitizeInput()` 함수로 HTML 특수문자 제거
   - `<`, `>`, `javascript:`, `onclick=` 등 제거
   - React는 기본적으로 이스케이프하지만 추가 검증

3. **XSS 방지 헤더**
   - `X-Content-Type-Options: nosniff` - MIME 타입 스니핑 방지
   - `X-Frame-Options: SAMEORIGIN` - 클릭재킹 방지
   - `X-XSS-Protection: 1; mode=block` - 브라우저 XSS 필터 활성화

**코드 위치:**
- `index.html`: CSP 및 보안 헤더
- `src/pages/write/WritePage.jsx`: `sanitizeInput()` 함수
- `src/pages/post/PostDetailPage.jsx`: 댓글 입력 검증

### 2. CSRF (Cross-Site Request Forgery) 방지

**문제점:**
- 악성 사이트에서 사용자 인증 정보를 이용해 요청을 보낼 수 있음
- 예: 사용자가 모르는 사이에 게시물이 삭제되거나 수정됨

**해결 방법:**
1. **Firebase 인증 토큰 사용**
   - Firebase는 자체적으로 CSRF 토큰을 관리
   - 모든 요청에 인증 토큰이 포함되어야 함

2. **SameSite 쿠키 정책**
   - Firebase가 자동으로 처리
   - 쿠키가 외부 사이트에서 전송되지 않도록 제한

3. **작성자 검증**
   - Firestore 보안 규칙에서 `authorId` 검증
   - 본인이 작성한 게시물만 수정/삭제 가능

**코드 위치:**
- `firestore.rules`: 작성자 검증 규칙
- Firebase 인증은 자동으로 CSRF 방지

### 3. 인젝션 (SQL/NoSQL) 방지

**문제점:**
- 사용자 입력이 쿼리에 직접 삽입되어 데이터베이스 조작 가능
- 예: `'; DROP TABLE posts; --` 같은 악성 쿼리

**해결 방법:**
1. **파라미터화된 쿼리 사용**
   - Firestore SDK는 자동으로 파라미터화
   - 사용자 입력이 쿼리에 직접 삽입되지 않음

2. **타입 검증**
   - Firestore 보안 규칙에서 모든 필드 타입 검증
   - 문자열, 숫자, 배열 등 타입 확인

3. **입력값 검증**
   - 클라이언트와 서버 양쪽에서 검증
   - 허용된 값만 사용 (카테고리 화이트리스트)

**코드 위치:**
- `firestore.rules`: 타입 및 값 검증
- `src/pages/write/WritePage.jsx`: 클라이언트 검증

### 4. 파일 업로드 취약점 방지

**문제점:**
1. **경로 탐색 공격**: `../../../etc/passwd` 같은 파일 이름으로 시스템 파일 접근
2. **악성 파일 업로드**: 실행 가능한 스크립트나 바이러스 파일 업로드
3. **파일 크기 공격**: 대용량 파일로 서버 공격

**해결 방법:**
1. **파일 이름 검증**
   - 사용자 입력 파일 이름 대신 안전한 파일 이름 생성
   - 경로 탐색 문자 (`..`, `/`, `\`) 제거
   - 특수문자 제거 및 길이 제한 (255자)

2. **파일 타입 검증**
   - MIME 타입 검증: `image/jpeg`, `image/png` 등만 허용
   - 파일 확장자 화이트리스트: `jpg`, `jpeg`, `png`, `gif`, `webp`만 허용
   - 클라이언트와 서버 양쪽에서 검증

3. **파일 크기 제한**
   - 게시물 이미지: 최대 5MB
   - 프로필 이미지: 최대 2MB
   - Storage 보안 규칙에서도 검증

4. **Storage 보안 규칙**
   - 파일 크기 및 타입 제한
   - 인증된 사용자만 업로드 가능

**코드 위치:**
- `src/pages/write/WritePage.jsx`: 파일 검증 로직
- `storage.rules`: Storage 보안 규칙

### 5. Git 취약점 방지

**문제점:**
- API 키, 비밀번호 등 민감한 정보가 Git 저장소에 커밋됨
- 공개 저장소에 노출되면 보안 위험

**해결 방법:**
1. **`.gitignore` 강화**
   - `.env` 파일 및 모든 환경 변수 파일 무시
   - API 키, 비밀번호, 인증서 파일 무시
   - 패턴: `*.env`, `*secret*`, `*password*`, `*api_key*` 등

2. **환경 변수 사용**
   - 모든 민감한 정보는 `.env` 파일에 저장
   - `.env` 파일은 Git에 커밋하지 않음
   - 프로덕션에서는 환경 변수 필수

3. **기본값 제거**
   - 프로덕션에서는 하드코딩된 API 키 제거
   - 개발 환경에서만 기본값 제공

**코드 위치:**
- `.gitignore`: 무시할 파일 패턴
- `src/firebase/config.js`: 환경 변수 사용

## 추가 보안 조치

### 입력값 검증
- **제목**: 2-100자
- **내용**: 10-1000자
- **댓글**: 최대 500자
- **위치**: 2-200자
- **위치 별칭**: 최대 50자

### Firestore 보안 규칙
- 모든 필드 타입 검증
- 문자열 길이 제한
- 카테고리 화이트리스트
- 작성자 검증

### Storage 보안 규칙
- 파일 크기 제한 (5MB/2MB)
- 파일 타입 제한 (이미지만)
- 인증된 사용자만 업로드 가능

### 프로덕션 콘솔 로그 제거
- 개발 모드에서만 로그 출력
- 민감한 정보 노출 방지

## 보안 체크리스트

배포 전 확인:
- [ ] `.env` 파일이 Git에 커밋되지 않았는지 확인
- [ ] 프로덕션 환경 변수가 모두 설정되었는지 확인
- [ ] Firestore 보안 규칙이 배포되었는지 확인
- [ ] Storage 보안 규칙이 배포되었는지 확인
- [ ] CSP 헤더가 올바르게 설정되었는지 확인
- [ ] 모든 API 키가 환경 변수로 관리되는지 확인

## 참고 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

