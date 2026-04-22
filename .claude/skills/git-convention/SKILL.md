---
name: git-convention
description: "Git commit message and branching conventions for consistent version control practices."
---

# Git Commit & Branching Convention

## Format

```
[<type>] <scope>: <short summary>
```

- **type** → category of change
- **scope** → optional, module/domain affected
- **summary** → concise description in imperative mood

### Types

- **feat** → new feature
- **fix** → bug fix
- **docs** → documentation changes
- **style** → formatting, linting, no logic changes
- **refactor** → code restructuring without behavior change
- **perf** → performance improvement
- **test** → adding or modifying tests
- **build** → build system or dependencies
- **ci** → CI/CD configuration
- **chore** → maintenance tasks
- **merge** → merge commit (branch → target)

### Language

**커밋 메시지는 반드시 한국어로 작성한다.** 단, 다음 항목은 영어 그대로 유지한다:

- `[type]` 태그 (feat, fix, style 등)
- scope (auth, global, frontend 등)
- 파일명, 함수명, 클래스명, 라이브러리명, CLI 명령어 등 기술 식별자
- 브랜치명·태그명을 포함하는 merge 커밋 제목

```
✅ [feat] auth: Google OAuth 로그인 플로우 추가
✅ [fix] upload: JPEG 매직 바이트 검증 오류 수정
✅ [refactor] global: JWT 알고리즘을 HS256으로 명시
✅ [merge] feat/auth-login → dev
❌ [feat] auth: add Google OAuth login flow
```

### Examples

```
[feat] auth: 이메일 인증 플로우 추가
[fix] user: 프로필 이미지 업로드 버그 수정
[docs] readme: 설치 방법 업데이트
[style] global: Tailwind 클래스 정렬 적용
[refactor] chat: 메시지 스토어 로직 단순화
[merge] feat/user-profile-edit → dev
```

---

## Branching Strategy

### Branch Model

- **main** → stable release branch (production)
- **dev** → integration branch (all features merged here before release)
- **feature branches** → created per feature/task

### Naming Convention

```
feat/<module>-<short-description>
```

Examples:

- `feat/auth-email-verification`
- `feat/user-profile-edit`

### Workflow

1. **Create feature branch** from `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feat/auth-email-verification
   ```
2. **Develop feature**
   - Commit using `[type] scope: summary` format.
   - Push branch to remote.
3. **Merge into dev**
   - Open PR from `feat/...` → `dev`.
   - Code review + lint/test checks must pass.
   - Merge via squash or rebase to keep history clean.
4. **Release**
   - When `dev` is stable, merge into `main`.
   - Tag release version (e.g., `v1.0.0`).

### Rules

- One feature per branch → one PR.
- Branch names must start with `feat/`, `fix/`, `docs/`, etc.
- Never commit directly to `dev` or `main`.
- PR must be reviewed before merge.
- CI/CD runs on `dev` and `main` only.
- .env files and secrets should never be committed. Use environment variables or secret management tools.
