# love6202

디지털 청첩장 플랫폼. 커플이 직접 온라인 청첩장을 제작하고, 하객이 RSVP·방명록·포토 업로드를 즐길 수 있는 웹 서비스입니다.

---

## 주요 기능

- **청첩장 제작** — 커플 정보, 예식 일정, 교통·주차, 공지 사항을 한 번에 작성
- **RSVP 관리** — 참석 의향 수집 및 식사·셔틀 인원 집계, CSV 내보내기
- **방명록** — 익명/로그인 모두 가능, 실시간 SSE 알림
- **포토 갤러리** — HOST가 관리하는 공식 사진 갤러리
- **포토 업로드** — 하객이 현장 사진을 자유롭게 업로드
- **계좌 정보** — 은행 계좌 · 카카오페이 · 토스 링크 통합 관리
- **관리자 패널** — 사용자 역할 관리, 전체 웨딩 조회

---

## 저장소 구조

```
love6202/
├── backend/          # Node.js + Express 5 API 서버
├── frontend/         # React 19 SPA (Vercel 배포)
├── docker/           # Docker Compose 파일 및 nginx 설정
│   ├── docker-compose.infra.yml   # PostgreSQL + Redis
│   ├── docker-compose.prod.yml    # 프로덕션 (Blue/Green)
│   ├── docker-compose.dev.yml     # 개발 환경
│   ├── nginx/                     # nginx 설정
│   └── postgres/init.sql
├── scripts/          # 배포 및 서버 초기화 스크립트
│   ├── server-setup.sh
│   ├── deploy-prod.sh
│   ├── deploy-dev.sh
│   └── health-check.sh
├── .github/workflows/
│   ├── deploy-prod.yml   # main → EC2 Blue/Green 배포
│   └── deploy-dev.yml    # dev → EC2 Rolling 배포
└── .env.example
```

---

## 문서

| 항목 | 링크 |
|---|---|
| **Backend** — 설치 · API 문서 · 환경변수 | [backend/README.md](./backend/README.md) |
| **Frontend** — 설치 · 라우트 · 환경변수 | [frontend/README.md](./frontend/README.md) |

---

## 기술 스택 요약

| 영역 | 기술 |
|---|---|
| Backend | Node.js, TypeScript, Express 5, Prisma 6, PostgreSQL 17, Redis 7 |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion |
| 인증 | Google OAuth2, JWT (httpOnly Cookie), Bcrypt |
| 파일 스토리지 | AWS S3 (웨딩·프로필·갤러리), Google Drive (하객 업로드) |
| 인프라 | EC2 (t3.small), Docker, Nginx, GitHub Actions |
| 프론트 배포 | Vercel |

---

## 배포 구조

```
                ┌─────────────┐
   push main    │  GitHub     │   push dev
  ────────────► │  Actions    │ ────────────►
                └──────┬──────┘
                       │ SSH
                       ▼
              ┌────────────────────┐
              │   EC2 (t3.small)   │
              │                    │
              │  nginx :80/:443    │  ◄── Let's Encrypt SSL
              │    │               │
              │  backend-blue  :3000   (Blue/Green)
              │  backend-green :3000
              │                    │
              │  PostgreSQL :5432  │
              │  Redis      :6379  │
              └────────────────────┘

              Frontend → Vercel (정적 배포)
```

### Blue/Green 배포 흐름 (`main` 브랜치)

1. GitHub Actions에서 Docker 이미지 빌드 → DockerHub push
2. EC2에 SSH 접속
3. 비활성 컨테이너(green/blue) 기동
4. 헬스체크 통과 시 nginx upstream 전환 → 기존 컨테이너 종료
5. 헬스체크 실패 시 자동 롤백 (기존 컨테이너 유지)

---

## 브랜치 전략

| 브랜치 | 역할 |
|---|---|
| `main` | 프로덕션 배포 대상 |
| `dev` | 통합 브랜치 (PR 대상) |
| `feat/<module>-<description>` | 기능 개발 브랜치 |

커밋 메시지 형식: `[type] scope: summary`

---

## GitHub Secrets 설정

| Secret | 설명 |
|---|---|
| `DOCKERHUB_USERNAME` | DockerHub 아이디 |
| `DOCKERHUB_TOKEN` | DockerHub Access Token |
| `EC2_HOST` | EC2 퍼블릭 IP 또는 도메인 |
| `EC2_SSH_KEY` | EC2 SSH 프라이빗 키 (PEM 전체) |

---

## 라이선스

Private Repository — 무단 사용 및 배포를 금합니다.
