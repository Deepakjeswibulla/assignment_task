# BUILD_PLAN.md — Implementation roadmap

Phases are executed sequentially. Check off items as completed.

## Phase 0 — Documentation foundation ✅
- [x] Create `AI_CONTEXT.md` with product, schema, logic, API
- [x] Create `BUILD_PLAN.md` (this file)
- [x] Create `PROMPTS.md` for key prompts record

## Phase 1 — Project scaffold ✅
- [x] Initialize Next.js 14 + TypeScript + Tailwind + App Router
- [x] Add Prisma, NextAuth, Zod, bcrypt, Socket.io, Vitest
- [x] Configure `package.json` scripts (`dev`, `build`, `start`, `test`)
- [x] Create `server.ts` custom server integrating Socket.io
- [x] Add `.env.example`, `.gitignore`

## Phase 2 — Database ✅
- [x] Write `prisma/schema.prisma` per AI_CONTEXT §3
- [x] Run initial migration (`prisma/migrations/20250605000000_init`)
- [x] Seed script (`prisma/seed.ts`)

## Phase 3 — Core libraries ✅
- [x] `src/lib/prisma.ts` — singleton client
- [x] `src/lib/splits.ts` — all 4 split modes + tests
- [x] `src/lib/balances.ts` — group + individual balances + tests
- [x] `src/lib/validations.ts` — Zod schemas
- [x] `src/lib/auth.ts` — NextAuth config

## Phase 4 — Authentication ✅
- [x] Register API route
- [x] NextAuth credentials provider
- [x] Middleware protecting `/` and `/groups/*`
- [x] Login / Register pages

## Phase 5 — Groups ✅
- [x] Groups API (list, create, detail)
- [x] Members API (add by email, remove)
- [x] Dashboard page (group list)
- [x] Group detail page (members, expenses list)

## Phase 6 — Expenses ✅
- [x] Expenses API (create with split validation, list)
- [x] New expense form (dynamic fields per split type)
- [x] Expense detail page with split breakdown

## Phase 7 — Balances & settlements ✅
- [x] Group balances API + UI component
- [x] Individual summary on dashboard
- [x] Settlements API + form
- [x] Wire settlements into balance display

## Phase 8 — Real-time chat ✅
- [x] Socket.io server auth + room logic
- [x] Messages API (persist + history)
- [x] Chat UI on expense detail page
- [x] Client socket connection with HTTP fallback

## Phase 9 — Tests & polish ✅
- [x] Vitest: splits.test.ts, balances.test.ts (12 tests passing)
- [x] UI consistency pass (layout, nav, error states)
- [x] Loading states on client components

## Phase 10 — Deployment ✅
- [x] `render.yaml` blueprint
- [x] Production build verification (`npm run build` passes)
- [x] Final `README.md`
- [x] Audit `AI_CONTEXT.md` for accuracy

## Phase 11 — Final audit ✅
- [x] All required features implemented in code
- [x] Docs consistent with code
- [x] No TODOs on core paths
