# Lessons

## UI 요청 대상이 모호하면 화면에서 먼저 확인한다
- 사례: "웨딩갤러리가 너무 크다" → InfoTab 히어로로 추정해 수정했으나 실제 대상은 갤러리 ImageViewer였음
- 원인: `<picture>` 래퍼 추가(432c0e4) 후 img의 `max-h-full`이 기준 높이를 잃어 원본 크기로 렌더링
- 규칙: 대상 컴포넌트가 여러 후보면 브라우저로 재현하거나 사용자에게 확인 후 수정. `<picture>`로 감쌀 때는 부모 크기 기준(%) 스타일이 깨지지 않는지 확인 (`className="contents"`)

## dev/prod 배포는 동시에 트리거하지 않는다 (같은 EC2, compose 프로젝트 공유 위험)
- 사례: dev → main 연속 푸시로 두 배포가 동시에 실행 → dev compose가 prod postgres/redis 컨테이너를 교체해 운영 장애(500, 로그인 실패)
- 원인: 두 compose 파일이 같은 디렉터리(docker/)라 프로젝트명이 `docker`로 같고 서비스명도 같음
- 조치: dev 서버 환경·자동 배포 제거 (2026-10-04)
- 규칙: 같은 서버에 compose 환경을 추가할 땐 최상위 `name:` 명시. 배포 후에는 `/health`뿐 아니라 DB를 쓰는 엔드포인트(`/api/weddings/latest`)까지 확인
