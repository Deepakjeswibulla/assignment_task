# PROMPTS.md — Key prompts used to build SplitShare

This file records the principal prompts that shaped the project, per assignment requirements.

## Prompt 1 — Master build instruction (initial)

**Source:** User assignment brief  
**Date:** 2026-06-05

> Build a polished, working, deployed Splitwise-inspired app with: login/authentication, group creation and management, add/remove members, expenses with equal/unequal/percentage/share splits, group-wise balances, individual balance summaries, settlement/payment recording, and real-time expense chat, using a relational database only. Produce README.md, BUILD_PLAN.md, AI_CONTEXT.md (detailed enough to recreate the app), and a record of key prompts. Treat AI_CONTEXT.md as single source of truth. Work sequentially from foundation to finish without stopping for multiple prompts.

**Decisions driven by this prompt:**
- Empty repo → greenfield Next.js + PostgreSQL + Prisma architecture
- Socket.io on custom server for real-time (Vercel-incompatible)
- AI_CONTEXT.md documents every schema field, API route, and business rule
- Vitest for split/balance unit tests
- Render for deployment target

---

## Prompt 2 — Settlement balance logic fix (internal)

**Source:** Failing unit test during Phase 9  
**Date:** 2026-06-05

> Test expected settlement to reduce `bob→alice` debt from $100 to $60 after $40 payment.

**Decision:** Settlements subtract from the directed debt edge (`fromUserId→toUserId`) rather than adding a reverse edge. Overflow flips to the opposite direction. Documented in `AI_CONTEXT.md` §4 and `src/lib/balances.ts`.
