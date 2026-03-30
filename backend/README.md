# Backend

Node.js + Express 5 + Prisma 기반 REST API 서버.

---

## 목차

- [기술 스택](#기술-스택)
- [설치 및 실행](#설치-및-실행)
- [환경변수](#환경변수)
- [프로젝트 구조](#프로젝트-구조)
- [API 문서](#api-문서)
  - [인증 (Auth)](#인증-auth)
  - [사용자 (User)](#사용자-user)
  - [웨딩 (Wedding)](#웨딩-wedding)
  - [RSVP](#rsvp)
  - [방명록 (Guestbook)](#방명록-guestbook)
  - [갤러리 (Gallery)](#갤러리-gallery)
  - [업로드 (Upload)](#업로드-upload)
  - [은행 (Bank)](#은행-bank)
  - [관리자 (Admin)](#관리자-admin)
- [에러 코드](#에러-코드)
- [아키텍처](#아키텍처)

---

## 기술 스택

| 분류 | 기술 |
|---|---|
| Runtime | Node.js 22, TypeScript 5 |
| Framework | Express 5 |
| ORM | Prisma 6 (PostgreSQL 17) |
| Cache | Redis 7 (ioredis) |
| 인증 | JWT + Google OAuth2 |
| 파일 업로드 | Multer + AWS S3 + Sharp |
| 파일 스토리지 | Google Drive (하객 업로드) |
| 이메일 | Nodemailer |
| 유효성 검증 | Zod 4 |
| 보안 | Helmet, bcryptjs, CSRF |
| 테스트 | Vitest + Supertest |

---

## 설치 및 실행

### 사전 요구사항

- Node.js 22+
- PostgreSQL 17
- Redis 7

### 설치

```bash
cd backend
npm install
```

### 데이터베이스 설정

```bash
# .env 파일 생성 (아래 환경변수 섹션 참고)
cp ../.env.example .env

# Prisma Client 생성
npx prisma generate

# 마이그레이션 실행
npx prisma migrate dev
```

### 개발 서버 실행

```bash
npm run dev       # tsx watch (핫 리로드)
```

### 프로덕션 빌드

```bash
npm run build     # TypeScript → dist/
npm run start     # node dist/server.js
```

### 유용한 명령어

```bash
npx prisma studio          # DB GUI (브라우저)
npx prisma migrate dev     # 마이그레이션 생성 및 적용
npx prisma generate        # Prisma Client 재생성
npm run test               # 테스트 실행
npm run test:coverage      # 커버리지 리포트
```

---

## 환경변수

`backend/.env` 파일에 아래 변수를 설정합니다.

```env
# ── 서버 ───────────────────────────────────────────
NODE_ENV=development          # development | production | test
PORT=3000

# ── 데이터베이스 ───────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/love6202

# ── Redis ──────────────────────────────────────────
REDIS_URL=redis://:password@localhost:6379

# ── JWT ────────────────────────────────────────────
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_ACCESS_EXPIRATION=3600000     # 1시간 (ms)
JWT_REFRESH_EXPIRATION=86400000   # 1일 (ms)

# ── Google OAuth2 ──────────────────────────────────
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=http://localhost:8000/login/oauth2/code/google

# ── AWS S3 ─────────────────────────────────────────
AWS_REGION=ap-northeast-2
AWS_BUCKET=your-s3-bucket-name
AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# ── 프론트엔드 URL ──────────────────────────────────
FRONTEND_URL=http://localhost:3000

# ── Kakao (주소 → 좌표 변환) ───────────────────────
KAKAO_REST_API_KEY=your-kakao-rest-api-key

# ── Google Drive (하객 사진 저장) ──────────────────
GOOGLE_DRIVE_REFRESH_TOKEN=your-refresh-token
GOOGLE_DRIVE_ROOT_FOLDER_ID=your-folder-id

# ── SMTP (새 기기 로그인 알림) ──────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 프로젝트 구조

```
src/
├── app.ts                    # Express 앱 설정 (미들웨어, 라우터 등록)
├── server.ts                 # 서버 진입점 (포트 바인딩)
├── prisma.ts                 # Prisma Client 싱글톤
├── config/
│   ├── env.ts                # 환경변수 (Zod 스키마로 검증)
│   ├── redis.ts              # Redis 클라이언트
│   └── s3.ts                 # AWS S3 클라이언트
├── middleware/
│   ├── auth.ts               # JWT 인증 (authenticate, optionalAuth, requireAdmin)
│   ├── validate.ts           # Zod 요청 유효성 검증
│   ├── errorHandler.ts       # 전역 에러 핸들러
│   ├── upload.ts             # Multer 업로드 핸들러
│   ├── session.ts            # 세션 ID 관리 및 로테이션
│   └── csrf.ts               # CSRF 이중 쿠키 방어
├── domain/                   # 도메인별 라우터 · 서비스 · 스키마
│   ├── user/                 # 인증 + 프로필
│   ├── wedding/              # 청첩장 + 하위 리소스
│   ├── rsvp/                 # 참석 의향서
│   ├── guestbook/            # 방명록
│   ├── gallery/              # 갤러리
│   ├── upload/               # 하객 포토 업로드
│   ├── bank/                 # 은행 마스터 데이터
│   └── admin/                # 관리자 패널
├── service/
│   ├── s3.service.ts         # S3 업로드/삭제
│   ├── kakao.service.ts      # 카카오 지오코딩
│   ├── googleDrive.service.ts
│   ├── email.service.ts      # 이메일 발송
│   ├── refreshToken.service.ts
│   └── securityLog.service.ts
└── util/
    ├── jwt.ts                # JWT 생성/검증
    ├── apiResponse.ts        # 표준 응답 포맷
    ├── appError.ts           # 커스텀 에러 클래스
    ├── pagination.ts         # 페이지네이션 헬퍼
    └── cookie.ts             # 쿠키 유틸
```

---

## API 문서

### 공통

**응답 포맷**

```json
{
  "status": { "code": 200, "message": "OK" },
  "data": { ... }
}
```

**인증 방식**

| 구분 | 설명 |
|---|---|
| `인증 필요` | `access_token` httpOnly 쿠키 필수 |
| `선택적 인증` | 쿠키 있으면 userId 주입, 없으면 익명 처리 |
| `불필요` | 누구나 접근 가능 |

---

### 인증 (Auth)

기본 경로: `/api/auth`
레이트 리밋: 10 req / 15분

#### `GET /api/auth/csrf`

CSRF 토큰 발급. 상태 변경 요청 전 선행 호출하여 `X-CSRF-Token` 헤더에 포함해야 합니다.

**Response**
```json
{ "data": { "csrfToken": "hex-string" } }
```

---

#### `POST /api/auth/login`

Google OAuth2 코드로 로그인합니다. 성공 시 `access_token`, `refresh_token` httpOnly 쿠키를 설정합니다.

**Request Body**
```json
{
  "code": "google-oauth2-authorization-code",
  "deviceId": "uuid-v4"
}
```

**Response**
```json
{
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "닉네임",
      "profileImageUrl": "https://...",
      "role": "GUEST",
      "weddingId": null
    }
  }
}
```

---

#### `POST /api/auth/refresh`

Refresh Token으로 Access Token을 갱신합니다.

**Request Body**
```json
{ "deviceId": "uuid-v4" }
```

---

#### `POST /api/auth/logout`

**인증 필요**

**Request Body**
```json
{ "deviceId": "uuid-v4" }
```

---

#### `POST /api/auth/check-nickname`

닉네임 중복 확인.

**Request Body**
```json
{ "nickname": "사용할닉네임" }
```

**Response**
```json
{ "data": { "available": true } }
```

---

### 사용자 (User)

기본 경로: `/api/users`
모든 엔드포인트 **인증 필요**

#### `GET /api/users/me`

현재 로그인 사용자 정보 조회.

**Response**
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "닉네임",
    "profileImageUrl": "https://...",
    "role": "HOST",
    "weddingId": 42
  }
}
```

---

#### `PATCH /api/users/me`

프로필 수정 (multipart/form-data).

| 필드 | 타입 | 설명 |
|---|---|---|
| `nickname` | string (선택) | 변경할 닉네임 |
| `file` | File (선택) | 프로필 이미지 |
| `removeProfileImage` | `"true"` (선택) | 프로필 이미지 삭제 |

---

#### `DELETE /api/users/me`

계정 소프트 삭제 (30일 내 재로그인으로 복구 가능).

---

### 웨딩 (Wedding)

기본 경로: `/api/weddings`

#### `GET /api/weddings/latest`

가장 최근 웨딩 공개 조회. **인증 불필요**

---

#### `GET /api/weddings/me`

내 웨딩 조회. **인증 필요**

---

#### `GET /api/weddings/:id`

특정 웨딩 공개 조회. **인증 불필요**

**Response** (주요 필드)
```json
{
  "data": {
    "wedding": {
      "id": 1, "title": "Our Wedding",
      "weddingDate": "2026-05-01T11:00:00Z",
      "venueName": "그랜드 볼룸",
      "venueAddress": "서울시 강남구 ...",
      "venueLat": 37.123, "venueLng": 127.456
    },
    "couples": [
      { "role": "GROOM", "name": "홍길동", "email": "groom@example.com" },
      { "role": "BRIDE", "name": "김영희", "email": "bride@example.com" }
    ],
    "accounts": [...],
    "schedules": [...],
    "transportations": [...],
    "announcements": [...],
    "heroImages": [...],
    "galleries": [...]
  }
}
```

---

#### `POST /api/weddings`

웨딩 생성. **인증 필요** — multipart/form-data

| 필드 | 타입 | 설명 |
|---|---|---|
| `data` | JSON string | 아래 스키마 참고 |
| `heroImages` | File[] (최대 4장) | 대표 사진 |
| `groomProfileImage` | File (선택) | 신랑 프로필 사진 |
| `brideProfileImage` | File (선택) | 신부 프로필 사진 |

**`data` 필드 스키마**
```json
{
  "wedding": {
    "title": "Our Wedding",
    "weddingDate": "2026-05-01T11:00:00Z",
    "venueName": "그랜드 볼룸",
    "venueAddress": "서울시 강남구 테헤란로 1",
    "venueDetail": "3층 크리스탈홀",
    "dressCode": "Smart Casual",
    "notice": "공지사항",
    "parkingInfo": "주차 안내",
    "mealInfo": "식사 안내",
    "greeting": "초대의 말씀"
  },
  "couples": [
    {
      "role": "GROOM",
      "name": "홍길동",
      "email": "groom@example.com",
      "contact": "010-1234-5678",
      "fatherName": "홍아버지",
      "isFatherAlive": true,
      "motherName": "홍어머니",
      "isMotherAlive": true
    }
  ],
  "accounts": [
    {
      "side": "GROOM",
      "bankName": "카카오뱅크",
      "bankCode": "090",
      "accountNumber": "3333-01-1234567",
      "accountHolder": "홍길동",
      "kakaoPayUrl": "https://qr.kakaopay.com/...",
      "orderIndex": 0
    }
  ],
  "schedules": [
    { "title": "신랑 입장", "description": "오후 1시", "orderIndex": 0 }
  ],
  "transportations": [
    {
      "type": "SUBWAY",
      "title": "지하철 이용 시",
      "description": "2호선 강남역 1번 출구",
      "orderIndex": 0
    }
  ],
  "announcements": [
    { "title": "주차 안내", "content": "2시간 무료 주차", "isPinned": true }
  ]
}
```

> `type` 값: `SUBWAY` | `BUS` | `SHUTTLE`
> `side` 값: `GROOM` | `GROOM_FAMILY` | `BRIDE` | `BRIDE_FAMILY`

---

#### `PUT /api/weddings/:id`

웨딩 수정. **인증 필요** — POST와 동일한 포맷, 추가로 `existingHeroImageUrls: string[]` 지원

---

#### `DELETE /api/weddings/:id`

웨딩 소프트 삭제. **인증 필요**

---

### RSVP

기본 경로: `/api/rsvp`

#### `POST /api/rsvp`

참석 의향서 제출. **선택적 인증** (익명 가능)

**Request Body**
```json
{
  "weddingId": 1,
  "attendance": "YES",
  "name": "홍길동",
  "side": "GROOM",
  "phone": "010-1234-5678",
  "attendeeCount": 2,
  "meal": { "willEat": true, "mealCount": 2 },
  "shuttle": { "willRide": false, "rideCount": 0 },
  "note": "알레르기 있습니다",
  "consent": true
}
```

> `attendance`: `YES` | `NO`
> `side`: `BRIDE` | `GROOM`
> `consent`는 반드시 `true`여야 제출 가능

---

#### `GET /api/rsvp/me?weddingId={id}`

내 RSVP 조회. **선택적 인증**

---

#### `PUT /api/rsvp/:id`

RSVP 수정. **선택적 인증** — 본인 확인 후 수정

**Request Body** (POST에서 `weddingId`, `consent` 제외한 나머지)

---

#### `DELETE /api/rsvp/:id`

RSVP 취소. **선택적 인증**

---

#### `GET /api/rsvp/stats?weddingId={id}`

RSVP 통계. **ADMIN/HOST 전용**

**Response**
```json
{
  "data": {
    "totalRsvpCount": 100,
    "attendingCount": 85,
    "totalAttendeeCount": 200,
    "totalMealCount": 180,
    "totalShuttleCount": 30
  }
}
```

---

#### `GET /api/rsvp/list?weddingId={id}&page=0&size=20`

RSVP 목록 조회 (페이지네이션). **ADMIN/HOST 전용**

---

#### `GET /api/rsvp/export?weddingId={id}`

RSVP CSV 내보내기. **ADMIN/HOST 전용**
Response: `text/csv; charset=utf-8` (UTF-8 BOM 포함, Excel 호환)

---

### 방명록 (Guestbook)

기본 경로: `/api/guestbooks`

#### `GET /api/guestbooks?weddingId={id}&page=0&size=10`

방명록 목록 조회. **인증 불필요**

---

#### `POST /api/guestbooks`

방명록 작성. **인증 불필요** (익명 가능)

**Request Body**
```json
{
  "weddingId": 1,
  "name": "하객 이름",
  "content": "축하드립니다! (최대 200자)",
  "type": "post_01"
}
```

> `type`: `post_01` ~ `post_10` (포스트잇 디자인 종류)

---

#### `GET /api/guestbooks/subscribe?weddingId={id}`

실시간 방명록 알림 SSE 스트림. **ADMIN/HOST 전용**
`Content-Type: text/event-stream`

---

#### `DELETE /api/guestbooks/:id`

방명록 삭제. **ADMIN/HOST 전용**

---

### 갤러리 (Gallery)

기본 경로: `/api/galleries`

#### `GET /api/galleries?weddingId={id}&page=0&size=10`

갤러리 조회. **인증 불필요**

---

#### `POST /api/galleries`

갤러리 이미지 업로드. **ADMIN/HOST 전용** — multipart/form-data

| 필드 | 타입 | 설명 |
|---|---|---|
| `files` | File[] | 이미지 파일 |
| `weddingId` | number (query) | 웨딩 ID |

---

#### `DELETE /api/galleries`

갤러리 이미지 일괄 삭제. **ADMIN/HOST 전용**

**Request Body**
```json
{ "ids": [1, 2, 3] }
```

---

### 업로드 (Upload)

기본 경로: `/api/uploads`

#### `GET /api/uploads/image/:driveFileId`

Google Drive 이미지 스트리밍 프록시. **인증 불필요**

---

#### `GET /api/uploads/me?weddingId={id}`

내 업로드 목록. **선택적 인증**

---

#### `POST /api/uploads?weddingId={id}`

하객 사진 업로드. **선택적 인증** — multipart/form-data

| 필드 | 타입 | 설명 |
|---|---|---|
| `files` | File[] | 이미지 파일 |

---

#### `DELETE /api/uploads/:id`

업로드 삭제. **선택적 인증** (본인 확인)

---

### 은행 (Bank)

기본 경로: `/api/banks`

#### `GET /api/banks`

전체 은행 목록 조회. **인증 불필요**

---

#### `GET /api/banks/detect?accountNumber={number}`

계좌번호로 은행 자동 감지. **인증 불필요**

**Response**
```json
{ "data": { "bankCode": "090", "bankName": "카카오뱅크" } }
```

---

### 관리자 (Admin)

기본 경로: `/api/admin`
모든 엔드포인트 **ADMIN 전용**

#### `GET /api/admin/weddings`

전체 웨딩 목록 조회.

---

#### `GET /api/admin/users/search?query={keyword}`

사용자 검색 (이메일 · 닉네임, 최대 20건).

---

#### `PATCH /api/admin/users/:id/role`

사용자 역할 변경. 변경 이력은 `audit_logs` 테이블에 자동 기록됩니다.

**Request Body**
```json
{ "role": "HOST" }
```

> `role`: `GUEST` | `HOST` | `ADMIN`

---

## 에러 코드

| HTTP | 상황 |
|---|---|
| 400 | 유효성 검증 실패, 잘못된 입력 |
| 401 | 인증 필요 (토큰 없음 / 만료) |
| 403 | 권한 부족 |
| 404 | 리소스 없음 |
| 409 | 중복 (이미 존재하는 데이터) |
| 429 | 레이트 리밋 초과 |
| 500 | 서버 내부 오류 |

---

## 아키텍처

### 요청 흐름

```
Request
  → Helmet (보안 헤더)
  → CORS
  → cookieParser
  → ensureSession (세션 ID 발급)
  → verifyCsrf (POST/PUT/PATCH/DELETE)
  → [authenticate | optionalAuth]
  → validate (Zod)
  → Router
  → Service (비즈니스 로직 + Prisma)
  → apiResponse
Response
```

### 인증 흐름

```
1. 프론트엔드 → Google OAuth2 인가 요청
2. Google → /login/oauth2/code/google?code=XXX 리다이렉트
3. 서버 → Google에 코드 교환 → 사용자 정보 획득
4. 서버 → 사용자 생성/조회 → JWT 발급
5. access_token (1h) + refresh_token (1d) → httpOnly 쿠키 설정
6. 프론트엔드 → /oauth2/callback 리다이렉트
```

### 데이터 모델 관계

```
User ──── Wedding ──── Couple[]
                  ├─── Account[]
                  ├─── HeroImage[]
                  ├─── Schedule[]
                  ├─── Transportation[]
                  ├─── Announcement[]
                  ├─── Gallery[]
                  ├─── Guestbook[]
                  ├─── Upload[]
                  └─── Rsvp[]
```
