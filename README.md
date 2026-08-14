# 반응속도 측정기

버튼을 누르면 게임이 시작되고, 랜덤한 시간(1~12초) 뒤 화면이 빨간색으로 바뀌는 순간 클릭까지 걸린 시간을 ms 단위로 측정하는 웹앱입니다. 기록은 닉네임과 함께 Firebase(Firestore)에 저장되고, 결과 화면에 최고 기록 랭킹이 표시됩니다.

## 동작

- 화면 클릭 → 게임 시작 (파란 화면, 대기)
- 1~12초 사이 랜덤 시점에 화면이 빨간색으로 전환
- 빨간 화면에서 클릭 → 반응 속도(ms)를 초록 결과 화면에 표시
- 빨간색이 되기 전에 클릭 → 실패 처리 후 자동 재시작
- 결과 화면에서 닉네임 입력 후 저장 → Firestore에 기록 저장, TOP 5 랭킹 갱신

## 로컬 개발

```bash
npm install
cp .env.example .env   # 아래 안내에 따라 Firebase 값 채우기
npm run dev
```

## Firebase 설정 방법

이 프로젝트는 Firestore를 DB로 사용합니다. 아래 순서대로 진행하면 됩니다.

1. [Firebase 콘솔](https://console.firebase.google.com/)에 접속해 새 프로젝트를 생성합니다.
2. 프로젝트 생성 후 좌측 메뉴에서 **빌드 → Firestore Database**로 이동해 데이터베이스를 생성합니다. (프로덕션 모드로 시작해도 무방합니다. 보안 규칙은 이 저장소의 `firestore.rules`를 그대로 배포하면 됩니다.)
3. 좌측 상단 톱니바퀴(프로젝트 설정) → **일반** 탭 → 하단 "내 앱" 섹션에서 웹 앱(`</>`) 아이콘을 눌러 앱을 등록합니다.
4. 등록하면 아래와 같은 `firebaseConfig` 객체가 표시됩니다. 이 값들을 `.env` 파일에 채워 넣습니다.

   ```js
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "...",
   };
   ```

   `.env` 매핑:

   | firebaseConfig 키 | .env 변수명 |
   | --- | --- |
   | apiKey | VITE_FIREBASE_API_KEY |
   | authDomain | VITE_FIREBASE_AUTH_DOMAIN |
   | projectId | VITE_FIREBASE_PROJECT_ID |
   | storageBucket | VITE_FIREBASE_STORAGE_BUCKET |
   | messagingSenderId | VITE_FIREBASE_MESSAGING_SENDER_ID |
   | appId | VITE_FIREBASE_APP_ID |

5. Firestore 보안 규칙을 배포합니다. Firebase 콘솔의 Firestore Database → 규칙 탭에서 이 저장소의 `firestore.rules` 내용을 붙여넣고 게시하거나, Firebase CLI로 배포합니다.

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore   # 기존 firestore.rules 사용
   firebase deploy --only firestore:rules
   ```

   규칙은 `scores` 컬렉션에 대해 읽기와 생성(create)만 허용하고, 수정·삭제는 막습니다. 문서 형식(`nickname`, `ms`, `createdAt` 필드, 닉네임 1~20자, ms 1~60000)도 검증합니다.

## 점수 저장/조회 함수

`src/firebase.js`에 두 함수로 분리되어 있습니다.

- `saveScore(nickname, ms)`: 닉네임과 반응 속도(ms)를 `scores` 컬렉션에 저장
- `getTop(n)`: 반응 속도가 빠른 순으로 상위 n개 기록을 조회

## GitHub Pages 배포

`.github/workflows/deploy.yml`이 `main` 브랜치에 push될 때 자동으로 빌드 후 GitHub Pages에 배포합니다.

1. 저장소 **Settings → Pages**에서 Source를 "GitHub Actions"로 설정합니다.
2. 저장소 **Settings → Secrets and variables → Actions**에서 아래 시크릿을 등록합니다. (로컬 `.env`와 동일한 값)
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. `main` 브랜치에 push되면 자동으로 빌드/배포되며, 배포 URL은 `https://lkh1134.github.io/LKH_TEST/` 입니다.

빌드 시 `vite.config.js`의 `base`가 `/LKH_TEST/`로 설정되어 있어 GitHub Pages 하위 경로에서도 정상 동작합니다.
