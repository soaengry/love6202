# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (`cd backend`)

```bash
npm run dev          # tsx watch — hot reload via ts-node
npm run build        # tsc && tsc-alias (resolves @/ path aliases in dist/)
npm run start        # node dist/server.js

npm run test         # vitest run (all tests, one pass)
npm run test:watch   # vitest (watch mode)
npm run test:coverage

# Prisma
npx prisma migrate dev --name <migration-name>
npx prisma migrate deploy        # CI / production
npx prisma db seed               # tsx prisma/seed.ts
npx prisma studio                # GUI browser
```

### Frontend (`cd frontend`)

```bash
npm run dev          # vite dev server
npm run build        # tsc -b && vite build
npm run lint         # eslint
npm run preview      # serve dist/

npm run test         # vitest run
npm run test:watch
npm run test:coverage
```

## Project Layout

Monorepo — `backend/` and `frontend/` are independent npm workspaces. The root `package.json` is a convenience wrapper.

### Backend key wiring points

- **`src/app.ts`** — registers every router and applies CSRF (`verifyCsrf`) to all routes except `/api/auth`. Adding a new domain: import its router here.
- **`src/domain/`** — each domain owns `*.router.ts`, `*.service.ts`, `*.schema.ts`, `*.types.ts`, `*.error.ts`. No repository layer; services call `prisma` directly.
- **`src/domain/admin/`** — already exists; `authenticate + requireAdmin` middleware applied to the whole router.
- **`@/` alias** → `src/` (tsconfig `paths`, resolved by `tsc-alias` at build time).
- **`"type": "commonjs"`** in `package.json`, but tsconfig targets `Node16` modules — imports must use extensions or path aliases.

### Frontend key wiring points

- **`src/app/routes/AppRouter.tsx`** — single route registry. Authenticated routes wrapped in `<ProtectedRoute>` + `<Suspense>` lazy imports.
- **`src/global/api/`** — Axios instance with interceptors: auto-attaches CSRF token, handles 401 → refresh → retry.
- **`src/global/pages/HomePage.tsx`** — entry page; loads `getLatestWedding()` unless `/:weddingId` param present.
- Domain barrel exports live in `domain/[name]/index.ts`.

## Test Architecture

**Backend** — Prisma and Redis are always mocked with `vi.mock`. Tests never hit a real database. Integration tests use `supertest` against the Express app. Unit tests isolate middleware and utilities. Coverage thresholds: 80 % lines/functions, 70 % branches.

**Frontend** — jsdom environment, `@testing-library/react`. `axios-mock-adapter` for API mocking.

## CSRF

Every state-changing API call must include the CSRF token. The frontend Axios interceptor handles this automatically (`GET /api/auth/csrf` → stored token → sent as header). In tests, mock or bypass `verifyCsrf`.

## Task & Lessons Tracking

- Write implementation plans to **`tasks/todo.md`** before starting non-trivial work; mark items complete inline.
- After any user correction, record the pattern in **`tasks/lessons.md`** to prevent recurrence.

## Workflow Orchestration

### Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building

### Subagent Strategy

- Use subagents liberally to keep the main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### Self-Improvement Loop

- After ANY correction from the user, update tasks/lessons.md with the pattern
- Review lessons at the session start for the relevant project

### Verification Before Done

- Never mark a task complete without proving it works
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them

## Core Principles

- Simplicity First: Make every change as simple as possible. Impact minimal code.
- No Laziness: Find root causes. No temporary fixes. Senior developer standards.
- Minimal Impact: Changes should only touch what's necessary. Avoid introducing bugs.
