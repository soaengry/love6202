# Frontend

React 19 + TypeScript + Vite 기반 디지털 청첩장 SPA.

---

## 목차

- [기술 스택](#기술-스택)
- [설치 및 실행](#설치-및-실행)
- [환경변수](#환경변수)
- [프로젝트 구조](#프로젝트-구조)
- [라우트](#라우트)
- [도메인 구조](#도메인-구조)
- [주요 패턴](#주요-패턴)

---

## 기술 스택

| 분류 | 기술 |
|---|---|
| Framework | React 19 |
| Language | TypeScript 5 (strict) |
| Build | Vite 8 |
| Routing | React Router DOM 7 |
| 상태 관리 | Zustand 5 (전역 인증 상태) |
| HTTP | Axios 1 (커스텀 인터셉터) |
| 폼 | React Hook Form 7 + Zod 4 |
| 스타일 | Tailwind CSS 4 |
| 애니메이션 | Framer Motion 12 |
| 아이콘 | React Icons 5 (Ionicons 5 기반) |
| 알림 | React Toastify 11 |
| 주소 검색 | react-daum-postcode |
| 지도 | Kakao Maps SDK (CDN) |
| 테스트 | Vitest 4 |

---

## 설치 및 실행

### 사전 요구사항

- Node.js 22+
- 실행 중인 백엔드 서버 (기본 `http://localhost:8000`)

### 설치

```bash
cd frontend
npm install
```

### 개발 서버 실행

```bash
npm run dev       # http://localhost:3000
                  # /api 요청은 백엔드로 자동 프록시
```

### 프로덕션 빌드

```bash
npm run build     # dist/ 생성
npm run preview   # 빌드 결과 로컬 미리보기
```

### 기타 명령어

```bash
npm run lint            # ESLint 검사
npm run test            # Vitest 실행
npm run test:watch      # 워치 모드
npm run test:coverage   # 커버리지 리포트
```

---

## 환경변수

`frontend/.env` 파일에 아래 변수를 설정합니다.

```env
# 백엔드 API 주소 (개발: vite.config.ts proxy, 프로덕션: 실제 도메인)
VITE_API_BASE_URL=http://localhost:8000/api

# Google OAuth2 인가 엔드포인트
VITE_OAUTH2_BASE_URL=https://accounts.google.com/o/oauth2/v2/auth

# Kakao Maps JavaScript SDK 키
VITE_KAKAO_MAP_KEY=your-kakao-javascript-key
```

> **Vercel 배포 시**: Vercel 대시보드 → Settings → Environment Variables에서 위 값을 설정합니다.

---

## 프로젝트 구조

```
src/
├── main.tsx                        # 앱 진입점 (React 마운트)
├── index.css                       # Tailwind 지시어, CSS 변수
├── app/
│   ├── App.tsx                     # 루트 컴포넌트 (앱 초기화, 인증 복구)
│   └── routes/
│       ├── AppRouter.tsx           # 라우트 정의
│       └── ProtectedRoute.tsx      # 인증 가드
├── global/
│   ├── api/
│   │   └── axiosInstance.ts        # Axios 커스텀 인스턴스 (인터셉터)
│   ├── components/
│   │   ├── MainLayout.tsx          # 하단 탭바 포함 레이아웃
│   │   ├── BottomNav.tsx           # 탭 네비게이션
│   │   ├── Header.tsx
│   │   └── Skeleton.tsx
│   ├── config/
│   │   └── config.ts               # Vite 환경변수 접근
│   ├── constants/
│   │   └── animations.ts           # Framer Motion 프리셋
│   ├── hooks/
│   │   └── useScrollVisibility.ts  # 스크롤 헤더 숨김
│   ├── pages/
│   │   └── HomePage.tsx            # 메인 청첩장 페이지 (탭 전환)
│   ├── types/
│   │   └── ApiResponse.ts          # 공통 API 응답 타입
│   └── pages/tabs/
│       ├── InfoTab.tsx             # 정보 탭 (커플·일정·교통·계좌)
│       ├── RsvpTab.tsx             # RSVP 탭
│       ├── GuestbookTab.tsx        # 방명록 탭
│       ├── GalleryTab.tsx          # 갤러리 탭
│       └── UploadTab.tsx           # 하객 포토 탭
└── domain/
    ├── auth/                       # 인증 도메인
    │   ├── api/authApi.ts
    │   ├── components/
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── OAuth2CallbackPage.tsx
    │   │   ├── MyPage.tsx
    │   │   └── EditProfilePage.tsx
    │   ├── store/useAuthStore.ts   # Zustand 인증 스토어
    │   └── types.ts
    ├── wedding/                    # 청첩장 제작 도메인
    │   ├── api/weddingApi.ts
    │   ├── components/             # 스텝별 폼 컴포넌트
    │   │   ├── BasicInfoStep.tsx
    │   │   ├── CoupleStep.tsx
    │   │   ├── AccountStep.tsx
    │   │   ├── ScheduleStep.tsx
    │   │   ├── ExtraInfoStep.tsx
    │   │   └── ImageUploader.tsx
    │   └── pages/
    │       ├── WeddingCreatePage.tsx
    │       └── WeddingEditPage.tsx
    ├── rsvp/                       # RSVP 도메인
    │   ├── api/rsvpApi.ts
    │   ├── components/
    │   │   ├── RsvpForm.tsx
    │   │   ├── RsvpCard.tsx
    │   │   ├── RsvpStatsPanel.tsx
    │   │   └── RsvpAdminList.tsx
    │   └── types.ts
    ├── guestbook/                  # 방명록 도메인
    │   ├── api/guestbookApi.ts
    │   ├── components/
    │   │   ├── GuestbookCreateModal.tsx
    │   │   ├── GuestbookCard.tsx
    │   │   └── GuestbookMasonry.tsx
    │   └── types.ts
    ├── gallery/                    # 갤러리 도메인
    │   ├── api/galleryApi.ts
    │   ├── components/
    │   │   ├── GalleryUploadForm.tsx
    │   │   ├── ImageViewer.tsx
    │   │   └── MasonryGrid.tsx
    │   └── types.ts
    ├── upload/                     # 하객 포토 도메인
    │   ├── api/uploadApi.ts
    │   ├── components/
    │   │   ├── UploadForm.tsx
    │   │   └── MyUploadList.tsx
    │   └── types.ts
    └── admin/                      # 관리자 도메인
        ├── components/
        │   ├── UserPermissionManager.tsx
        │   └── WeddingCard.tsx
        └── types.ts
```

---

## 라우트

| 경로 | 컴포넌트 | 인증 | 설명 |
|---|---|---|---|
| `/login` | `LoginPage` | 불필요 | Google 로그인 |
| `/oauth2/callback` | `OAuth2CallbackPage` | 불필요 | OAuth2 코드 처리 |
| `/` | `HomePage` | 불필요 | 최신 청첩장 메인 페이지 |
| `/:weddingId` | `HomePage` | 불필요 | 특정 청첩장 메인 페이지 |
| `/me` | `MyPage` | 필요 | 내 프로필 |
| `/me/edit` | `EditProfilePage` | 필요 | 프로필 수정 |
| `/create` | `WeddingCreatePage` | 필요 | 청첩장 제작 |
| `/edit` | `WeddingEditPage` | 필요 | 청첩장 수정 |

### 메인 페이지 탭

`/` 및 `/:weddingId`는 하단 탭바로 아래 뷰를 전환합니다.

| 탭 ID | 레이블 | 컴포넌트 |
|---|---|---|
| `info` | 정보 | `InfoTab` — 커플·일정·교통·계좌·추가정보 |
| `rsvp` | 참석여부 | `RsvpTab` — RSVP 제출/조회, HOST 통계 |
| `guestbook` | 방명록 | `GuestbookTab` — 방명록 작성/목록 |
| `gallery` | 갤러리 | `GalleryTab` — 공식 갤러리 |
| `upload` | 포토 | `UploadTab` — 하객 포토 업로드 |

---

## 도메인 구조

각 도메인은 아래 구조를 따릅니다.

```
domain/<name>/
├── api/
│   └── <name>Api.ts          # Axios API 호출 함수
├── components/               # 해당 도메인 UI 컴포넌트
├── hooks/                    # 커스텀 훅 (선택)
├── types.ts                  # 요청/응답 타입 정의
├── <name>.constants.ts       # API 엔드포인트 상수 (선택)
└── <name>.schemas.ts         # Zod 스키마 (선택)
```

---

## 주요 패턴

### API 호출

모든 API 호출은 `global/api/axiosInstance.ts`의 커스텀 인스턴스를 사용합니다.

- 응답 인터셉터: `ApiResponse<T>` 래퍼에서 `data` 자동 추출
- 401 응답 시: `/api/auth/refresh` 자동 재시도 → 실패 시 로그아웃
- 쿠키 자동 전송: `withCredentials: true`

### 상태 관리

전역 상태는 `useAuthStore` (Zustand) 하나만 사용합니다.

```ts
const { user, isLoading, login, logout } = useAuthStore();
```

컴포넌트 내 비동기 상태는 `useState` + `useEffect`로 관리합니다.

### 폼 유효성 검증

React Hook Form + Zod resolver를 사용합니다.

```ts
const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: { ... },
});
```

### 애니메이션

Framer Motion 공통 프리셋을 `global/constants/animations.ts`에서 관리합니다.

```ts
const slideUpAnim = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, ... };
// 컴포넌트에서: <motion.div {...slideUpAnim}>
```

### 아이콘 컨벤션

`react-icons`의 `io5` Outline 계열로 통일합니다. 브랜드 로고(Google 등)만 예외.

```ts
import { IoHomeOutline, IoHome } from "react-icons/io5";
// 비활성: IoHomeOutline, 활성: IoHome
```

### 에러 처리

```ts
import { isAxiosError } from "axios";

try {
  await someApi();
} catch (err) {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 409) { /* 중복 */ }
    if (status === 403) { /* 권한 없음 */ }
  }
}
```

---

## Vercel 배포

1. Vercel 프로젝트 생성 → GitHub 저장소 연결
2. **Framework Preset**: Vite
3. **Root Directory**: `frontend`
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Environment Variables** 설정:
   ```
   VITE_API_BASE_URL=https://your-api-domain.com/api
   VITE_OAUTH2_BASE_URL=https://accounts.google.com/o/oauth2/v2/auth
   VITE_KAKAO_MAP_KEY=your-kakao-javascript-key
   ```
7. Google Cloud Console → OAuth2 클라이언트 → **승인된 리디렉션 URI**에 `https://your-api-domain.com/login/oauth2/code/google` 추가
