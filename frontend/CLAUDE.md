# Frontend — React 19 + TypeScript + Vite

## Command

```bash
npm run dev       # 개발 서버 (port 3000, /api → localhost:8000 프록시)
npm run build     # TypeScript 컴파일 + Vite 빌드
npm run preview   # 빌드 결과 미리보기
npm run lint      # ESLint
```

## 기술 스택

- Build: Vite 7
- Language: TypeScript 5.9 (strict mode)
- UI: React 19
- Routing: React Router DOM 7
- State: Zustand 5 (auth store)
- HTTP: Axios (interceptor 기반 토큰 갱신)
- Form: React Hook Form + Zod
- Styling: Tailwind CSS 3 (Pretendard 폰트)
- Animation: Framer Motion 12
- Icons: React Icons (Ionicons)
- Toast: React Toastify
- Address: react-daum-postcode
- Map: Kakao Maps (CDN)

## 프로젝트 구조

```
src/
├── app/
│   ├── App.tsx                   # 앱 루트, 인증 복원
│   └── routes/
│       ├── AppRouter.tsx         # 라우트 정의
│       └── ProtectedRoute.tsx    # 인증 보호 래퍼
├── domain/
│   ├── auth/                     # 로그인, OAuth2, 이메일 인증
│   ├── wedding/                  # 초대장 CRUD, 하위 섹션 전체
│   ├── guestbook/                # 방명록
│   ├── schedule/                 # 캘린더, 일정 관리
│   └── user/                     # 마이페이지, 프로필, 탈퇴
├── global/
│   ├── api/                      # Axios 인스턴스 (인터셉터)
│   ├── components/               # Layout, Header, BottomNav, Skeleton
│   ├── config/                   # 환경변수 (VITE_*)
│   ├── constants/                # 애니메이션 프리셋
│   ├── hooks/                    # useScrollVisibility
│   ├── pages/                    # HomePage
│   └── types/                    # ApiResponse
├── main.tsx
└── index.css                     # Tailwind 디렉티브, CSS 변수
```

## 도메인 내부 구조 패턴

각 도메인은 동일한 패턴을 따른다:

```
domain/[feature]/
├── api/              # *Api.ts — API 호출 함수
├── components/       # UI 컴포넌트
├── pages/            # *Page.tsx — 라우트 대응 페이지
├── store/            # use*Store.ts — Zustand 스토어 (필요 시)
├── types.ts          # 요청/응답 DTO
├── *.constants.ts    # 상수 (엔드포인트, 유효성 규칙)
├── *.utils.ts        # 유틸리티 함수
└── index.ts          # barrel export
```

## 라우팅

**공개:**
`/` (정보/축의금/방명록/갤러리/업로드 탭), `/login`, `/signup`, `/oauth2/callback`

**인증 필요 (ProtectedRoute):**
`/create` (초대장 생성), `/edit`(결혼식 정보 수정),
`/me`, `/me/edit`, `/me/delete`

## 코딩 컨벤션

### 네이밍

- 파일: 페이지 `*Page.tsx`, 컴포넌트 `PascalCase.tsx`, API `*Api.ts`, 스토어 `use*.ts`, 상수 `*.constants.ts`, 유틸 `*.utils.ts`
- 변수/함수: `camelCase`, 상수: `UPPER_SNAKE_CASE`, 컴포넌트/타입: `PascalCase`

### 상태 관리

- 전역 상태: Zustand (auth만 해당)
- 컴포넌트 상태: `useState`
- Redux, Context API 사용하지 않음

### API 통신

- 모든 응답은 `ApiResponse<T>` (`{ status: { code, message }, data }`) 구조
- Axios 인터셉터가 `data` 필드를 자동 추출
- 401 발생 시 리프레시 토큰으로 자동 갱신, 실패 시 로그아웃

### 스타일링

- Tailwind 유틸리티 클래스만 사용, CSS-in-JS 없음
- 커스텀 컬러: `primary(#75bd28), `Highlight (#f5a623)`
- light mode, dark mode 고려 - `index.css`에서 `:root`와 `.dark`로 각각 값을 주입, `tailwind.config.js`에서 `darkMode: 'class'`
- 애니메이션: `global/constants/animations.ts`의 Framer Motion 프리셋 사용

### 폼

- React Hook Form + Zod 스키마 조합
- `@hookform/resolvers`로 연결

### 기타 컨벤션

- **컴포넌트**: `const Component: FC<Props> = () => {}` 형식
- **타입**: `interface`로 정의, `types.ts`에 위치
- **API 상수**: `{module}.constants.ts`에 `as const` 객체로 정의
- **에러 처리**: `isAxiosError(err)` + 상태코드별 분기
- **로딩 상태**: `isSubmitting` / `isSending` 플래그로 버튼 `disabled` 처리
- **import 정렬**: 외부 라이브러리 → 내부 모듈 순서
- **DDD 구조**: `domain/{module}/` (api, store, components, pages, types)
- **상태관리**: Zustand — `useAuthStore` (user, tokens, isAuthenticated)
- **폼**: React Hook Form + Zod (`zodResolver`)
- **HTTP**: Axios — `axiosInstance` (인터셉터로 토큰 자동 첨부/갱신)
- **스타일**: Tailwind CSS 유틸리티 클래스만 사용 (인라인 `style` 속성 금지)
- **Barrel Export**: 각 모듈의 `index.ts`에서 re-export
- **UI 텍스트**: 한국어

## 인증 흐름

1. `App.tsx` 마운트 시 `getMe()` 호출 → 쿠키 유효하면 Zustand 스토어에 사용자 설정
2. 401 발생 시 `POST /auth/refresh` 자동 호출 (브라우저가 refresh 쿠키 전송)
3. 리프레시 실패 시 로그아웃 → `/login` 리다이렉트
4. 토큰: httpOnly 쿠키 (`access_token`, `refresh_token`) — JS 접근 불가
5. Device ID만 localStorage에 저장 (`love_device_id`)

## Environment Variables

`.env`에 다음 키 필수:
`VITE_API_BASE_URL`, `VITE_OAUTH2_BASE_URL`, `VITE_KAKAO_MAP_KEY`
