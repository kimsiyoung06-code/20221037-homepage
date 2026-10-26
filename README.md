# TOON PICK — 전체 프로젝트

## 실행 방법
1. 이 폴더를 압축 해제합니다.
2. VS Code에서 `TOON_PICK_FULL` 폴더를 엽니다.
3. Live Server 확장 프로그램을 설치합니다.
4. `index.html`을 우클릭한 뒤 **Open with Live Server**를 선택합니다.

## 포함 파일
- `index.html`: 메인 웹툰 탐색 페이지
- `style.css`: 전체 디자인 및 반응형 레이아웃
- `catalogue.js`: API 실패 시 표시할 샘플 웹툰 목록
- `app.js`: 검색, 플랫폼/장르 필터, 찜하기, 취향 테스트, API 연결
- `signup.html`: 회원가입 데모 페이지
- `signup.js`: 데모 회원가입 폼 검증

## API 연결 안내
`app.js`는 공개 커뮤니티 API `https://korea-webtoon-api-cc7dda2f0d77.herokuapp.com`에 자동 연결을 시도하며, 버튼으로 다시 시도할 수 있습니다. 이 서버는 공식 네이버/카카오 API가 아니며, 서버 중단·주소 변경·CORS 제한·응답 형식 변경 시 연결에 실패할 수 있습니다. 실패해도 샘플 목록은 표시됩니다. 실제 API 연결 성공 여부는 브라우저에서 페이지를 열어 API 상태 메시지로 확인하세요.

## 회원가입 안내
회원가입은 프런트엔드 데모입니다. 계정 정보 일부가 현재 브라우저의 `localStorage`에 저장되지만 비밀번호는 저장하지 않습니다. 서버 인증/DB가 없으므로 실제 비밀번호를 입력하지 마세요.
