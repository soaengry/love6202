# CLAUDE.md

## Build Commands

```bash
npm run dev          # 개발 서버 (tsx watch)
npm run build        # TypeScript 컴파일
npm run start        # 프로덕션 서버
npx prisma migrate dev    # DB 마이그레이션 (개발)
npx prisma generate       # Prisma Client 재생성
npx prisma studio         # DB GUI
```

## Tech Stack

- Runtime: Node.js + TypeScript (ESM)
- Framework: Express 5
- ORM: Prisma 6
- Database: PostgreSQL 18
- Cache: Redis 7 (ioredis)
- Auth: JWT (jsonwebtoken) + Passport.js (OAuth2)
- Validation: Zod
- File Upload: Multer + @aws-sdk/client-s3
- Email: Nodemailer

## Project Structure

```
src/
├── app.ts                    # Express 앱 설정 (미들웨어, 라우터 등록)
├── server.ts                 # 서버 시작점
├── prisma.ts                 # Prisma Client 싱글톤
├── config/                   # 환경변수, Redis, S3 클라이언트
├── middleware/               # auth, validate, errorHandler, upload
├── domain/                   # 도메인별 router, service, schema, types
│   ├── user/                 # 로그인, OAuth2, 프로필
│   ├── wedding/              # 초대장 + 하위 리소스 전체
│   ├── attendance/           # 참석 RSVP
│   ├── guestbook/            # 방명록
│   └── bank/                 # 은행 마스터 데이터
├── service/                  # 외부 서비스 (S3, Email, Kakao, RefreshToken)
├── util/                     # jwt, hash, apiResponse, appError, pagination
└── types/                    # Express Request 타입 확장
```

## Architecture

- **Router** (`*.router.ts`): 라우트 정의, 미들웨어 조합, 요청/응답만 처리. 비즈니스 로직 금지.
- **Service** (`*.service.ts`): 비즈니스 로직 전담. Prisma Client 직접 호출. 별도 Repository 레이어 없음.
- **Schema** (`*.schema.ts`): Zod 스키마. 요청 유효성 검증 정의.
- **Types** (`*.types.ts`): 응답 DTO 타입 및 변환 함수.
- Soft delete: `deleted_at` 필드, Prisma middleware로 자동 필터링

## Coding Conventions

### General

- TypeScript strict mode
- 모든 파일은 ESM (`import/export`), 확장자 `.ts`
- 함수형 모듈 패턴 사용 — 클래스 서비스 대신 `export function`
- 절대 경로 import: `@/` → `src/`
- 한 파일 한 책임 — 서비스 파일이 비대해지면 분리

### Naming

### 네이밍

- 파일: `kebab-case` (`wedding.router.ts`)
- 변수/함수: `camelCase`
- 타입/인터페이스: `PascalCase`
- 상수/에러코드: `UPPER_SNAKE_CASE`
- DB 테이블: `snake_case` (Prisma `@@map`)

### 응답 포맷

모든 API 응답은 통일된 구조를 따른다:

```json
{
  "status": { "code": 200, "message": "OK" },
  "data": { ... }
}
```

에러 시 `data`는 `null`, `status.code`에 HTTP 상태 코드.

### 에러 처리

- `AppError(code, statusCode, message)` 클래스를 throw
- 도메인별 에러 코드 상수 객체로 관리 (`UserErrorCode`, `WeddingErrorCode`)
- 글로벌 에러 미들웨어가 `AppError`와 `ZodError`를 포착하여 응답 변환
- | Code name pattern                              | HTTP Status |
  | ---------------------------------------------- | ----------- |
  | `AUTH*`, `UNAUTHORIZED_ACCESS`                 | 401         |
  | `INVALID_PASSWORD`, `*UNAUTHORIZED` (non-AUTH) | 403         |
  | `DUPLICATE*`                                   | 409         |
  | `*NOT_FOUND`                                   | 404         |
  | `VALIDATION*`, `*LIMIT_EXCEEDED`, others       | 400         |

### Prisma 사용

- Repository 레이어 없이 Service에서 `prisma.model.method()` 직접 호출
- 트랜잭션: `prisma.$transaction(async (tx) => { ... })`
- N+1 방지: `include` 또는 `select`로 필요한 관계만 로드
- 소프트 삭제: `deletedAt` 필드 기반, 조회 시 `where: { deletedAt: null }` 필수
- 낙관적 잠금: `where`에 `version` 조건 포함, `data`에 `version: { increment: 1 }`

### 인증

- JWT 토큰은 httpOnly 쿠키(`access_token`, `refresh_token`)로 전달
- `authenticate` 미들웨어 → `req.cookies.access_token`에서 토큰 읽기 → `req.userId`, `req.userRole` 주입
- `requireAdmin` — ADMIN 권한 필수
- `optionalAuth` — 비로그인 허용 (방명록 등)
- 호스트 권한: user의 role이 HOST인 경우
- JWT implementation checklist:
  [x] Refresh tokens stored securely (httpOnly cookie)
  [x] Refresh tokens rotated on every use
  [x] Token blacklist in place for logout (Redis)
  [x] Sensitive data NOT stored in payload
  [ ] Algorithm explicitly set (avoid "none")
  [x] Tokens validated on every request

### 유효성 검증

- Zod 스키마를 `validate` 미들웨어에 전달
- `req.body`, `req.params`, `req.query` 각각 스키마 정의 가능

## 핵심 비즈니스 규칙

- 디바이스 제한: 사용자당 최대 5개, 초과 시 가장 오래된 디바이스 제거
- 소프트 삭제: 30일 이내 복구 가능, 이후 영구 삭제 대상
- 주소 지오코딩: 카카오 API로 주소 → 좌표 변환

## Key Implementation Notes

- JWT: Access token 1h, Refresh token 1d (Redis 저장)
- WebSocket: 방명록 등록 시 신랑/신부에게 실시간 알림
- Soft delete: Prisma middleware로 자동 필터링
