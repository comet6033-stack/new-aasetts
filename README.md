# MY ASSET — Netlify 배포 가이드

## 방법 A. GitHub 연동 (가장 쉬움, 로컬에 아무것도 설치 안 해도 됨)

1. 이 폴더를 그대로 GitHub 저장소에 올린다. (새 저장소 만들고 파일 전부 업로드)
2. https://app.netlify.com 접속 → "Add new site" → "Import an existing project"
3. GitHub 저장소 선택
4. Build settings는 자동으로 잡힘 (netlify.toml에 이미 적혀 있음)
   - Build command: npm run build
   - Publish directory: dist
5. "Deploy site" 클릭 → 몇 분 뒤 완료

## 방법 B. 로컬에서 빌드 후 드래그 앤 드롭

1. 이 폴더를 컴퓨터에 다운로드
2. 터미널에서 폴더로 이동 후:
   npm install
   npm run build
3. 생성된 `dist` 폴더를 https://app.netlify.com/drop 페이지에 그대로 드래그 앤 드롭
4. 몇 초 뒤 URL 발급됨

## 참고
- 데이터는 브라우저 localStorage에 저장돼요 (기기별로 따로 저장됩니다).
- 앱 안 "설정 > JSON 백업"으로 다른 기기로 옮길 수 있어요.
- 폰에서 "홈 화면에 추가"로 열면 주소창 없이 앱처럼 떠요.
