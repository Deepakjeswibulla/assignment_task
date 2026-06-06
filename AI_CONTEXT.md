# AI_CONTEXT.md — SplitShare (Splitwise-inspired expense sharing app)

> **Single source of truth.** Another engineer or AI should be able to recreate this exact application from this document plus `BUILD_PLAN.md`.

## 1. Product summary

**SplitShare** is a web app for splitting expenses among friends in groups. Users authenticate, create/join groups, record expenses with flexible split modes, view who owes whom, record settlement payments, and discuss individual expenses via real-time chat.

### Required features (assignment scope)

| Feature | Status | Notes |
|---------|--------|-------|
| Login / authentication | Done | Email + password via NextAuth JWT sessions |
| Group creation & management | Done | Name, description, creator is ADMIN |
| Add / remove members | Done | By email lookup; only admins remove |
| Expenses | Done | Description, amount, payer, date |
| Split: equal | Done | Divide evenly; remainder to payer |
| Split: unequal | Done | Explicit per-person amounts |
| Split: percentage | Done | Must sum to 100% |
| Split: share | Done | Integer ratios (e.g. 2:1:1) |
| Group-wise balances | Done | Pairwise simplified balances per group |
| Individual balance summary | Done | Cross-group totals per counterparty |
| Settlement / payment recording | Done | Subtracts from directed debt edges |
| Real-time expense chat | Done | Socket.io rooms per expense |
| Relational database only | Done | PostgreSQL via Prisma |

### Out of scope (explicitly excluded)

- OAuth / social login
- Multi-currency conversion
- Receipt OCR, recurring expenses, notifications
- Mobile native apps
- Non-relational stores (Redis for persistence, MongoDB, etc.)

Redis may be used only as a Socket.io adapter in multi-instance deploys; all durable data lives in PostgreSQL.

---

## 2. Architecture decisions

### Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 14** (App Router) | Full-stack TypeScript, SSR, API routes |
| Language | **TypeScript** | Assignment requirement |
| ORM | **Prisma** | Type-safe schema, migrations |
| Database | **PostgreSQL** | Relational, normalized |
| Auth | **NextAuth.js v4** | Credentials provider, JWT sessions (compatible with Next.js 14) |
| Real-time | **Socket.io** on custom Node server | True push for expense chat |
| Styling | **Tailwind CSS** | Fast, clean UI |
| Validation | **Zod** | API input validation |
| Tests | **Vitest** | Unit tests for balance/split logic |
| Deploy target | **Render** (Web Service) | Supports persistent WebSocket server |

### Why custom server (`server.ts`)

Vercel serverless cannot host long-lived Socket.io connections. A single Node process runs Next.js + Socket.io on Render/Railway/local.

### High-level diagram

```
Browser ──HTTP──► Next.js (pages + API routes)
       ──WS────► Socket.io (/api/socket)
                      │
                      ▼
                 PostgreSQL (Prisma)
```

---

## 3. Data model

### Entity-relationship overview

```
User ──┬──< GroupMember >── Group
       │                        │
       │                        ├──< Expense ──< ExpenseSplit
       │                        │       └──< ExpenseMessage
       │                        └──< Settlement
       └── (paidBy, from, to references)
```

### Tables

#### `User`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | String unique | Login identifier |
| name | String | Display name |
| passwordHash | String | bcrypt |
| createdAt | DateTime | |

#### `Group`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | String | |
| description | String? | |
| createdById | UUID FK → User | |
| createdAt | DateTime | |

#### `GroupMember`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| groupId | UUID FK | |
| userId | UUID FK | |
| role | Enum: ADMIN, MEMBER | Creator = ADMIN |
| joinedAt | DateTime | |
| Unique | (groupId, userId) | |

#### `Expense`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| groupId | UUID FK | |
| paidById | UUID FK → User | Who paid |
| description | String | |
| amount | Decimal(12,2) | Total in group currency |
| splitType | Enum: EQUAL, UNEQUAL, PERCENTAGE, SHARE | |
| expenseDate | DateTime | |
| createdAt | DateTime | |

#### `ExpenseSplit`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| expenseId | UUID FK | |
| userId | UUID FK | Participant |
| amount | Decimal(12,2) | Computed share in currency |
| splitValue | Decimal(12,4)? | Raw input: % or share count |
| Unique | (expenseId, userId) | |

#### `Settlement`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| groupId | UUID FK | |
| fromUserId | UUID FK | Payer of settlement |
| toUserId | UUID FK | Receiver |
| amount | Decimal(12,2) | |
| note | String? | |
| createdAt | DateTime | |

#### `ExpenseMessage`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| expenseId | UUID FK | |
| userId | UUID FK | |
| content | String | Max 2000 chars |
| createdAt | DateTime | |

---

## 4. Business logic

### Split calculation (`src/lib/splits.ts`)

1. **EQUAL** — `amount / n`, round to 2 decimals; assign rounding remainder (cents) to the payer so splits sum exactly to total.
2. **UNEQUAL** — User supplies per-person amounts; must sum to `amount` (±0.01 tolerance).
3. **PERCENTAGE** — User supplies percentages; each share = `amount * (pct/100)`; round; adjust remainder to payer.
4. **SHARE** — User supplies integer weights; share_i = `amount * (weight_i / sum(weights))`; round; adjust remainder to payer.

All modes produce `ExpenseSplit[]` with `{ userId, amount, splitValue? }`.

### Balance calculation (`src/lib/balances.ts`)

For a group, build a directed debt map:

- **Expense**: For each split where `userId !== paidById`, `userId` owes `paidById` the split `amount`.
- **Settlement**: `fromUserId` pays `toUserId` → subtracts `amount` from `fromUserId→toUserId` debt; overflow flips to reverse edge.

Net balance between A and B:
- `net(A→B) = debts[A][B] - debts[B][A]`
- If positive, A owes B that amount.

**Group balances**: For each member, aggregate net owed to/from all others.

**Individual summary**: Sum group balances across all groups for the logged-in user vs each counterparty.

### Authorization rules

- Must be authenticated for all app routes except `/login`, `/register`.
- Group access: user must be `GroupMember`.
- Add expense / chat: any group member.
- Add member / remove member: ADMIN only.
- Remove member: cannot remove self if sole admin (must transfer admin or delete group).

---

## 5. API surface

### REST (Next.js Route Handlers under `/api`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register` | Create account |
| * | `/api/auth/[...nextauth]` | NextAuth handlers |
| GET/POST | `/api/groups` | List / create groups |
| GET | `/api/groups/[id]` | Group detail |
| POST | `/api/groups/[id]/members` | Add member by email |
| DELETE | `/api/groups/[id]/members/[userId]` | Remove member |
| GET/POST | `/api/groups/[id]/expenses` | List / create expenses |
| GET | `/api/groups/[id]/balances` | Group balance matrix |
| GET/POST | `/api/groups/[id]/settlements` | List / record settlement |
| GET | `/api/users/me/balances` | Cross-group summary |
| GET/POST | `/api/expenses/[id]/messages` | Chat history / send (HTTP fallback) |

### Socket.io events

| Event | Direction | Payload |
|-------|-----------|---------|
| `join_expense` | client→server | `{ expenseId }` |
| `leave_expense` | client→server | `{ expenseId }` |
| `send_message` | client→server | `{ expenseId, content }` |
| `new_message` | server→client | `ExpenseMessage` + user name |

Server validates session cookie before joining rooms. Room name: `expense:{expenseId}`.

---

## 6. UI pages

| Route | Purpose |
|-------|---------|
| `/login` | Sign in |
| `/register` | Sign up |
| `/` | Dashboard: groups list + individual balance summary |
| `/groups/[id]` | Group detail: members, expenses, balances, add expense |
| `/groups/[id]/expenses/new` | Create expense form |
| `/groups/[id]/expenses/[expenseId]` | Expense detail + real-time chat |
| `/groups/[id]/settlements/new` | Record payment |

---

## 7. Environment variables

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<random 32+ chars>
NEXTAUTH_URL=http://localhost:3000
```

Production on Render: set `NEXTAUTH_URL` to deployed URL.

---

## 8. Assumptions & tradeoffs

1. **Single currency per group** — No FX; amounts are plain decimals.
2. **Email is unique identity** — Adding member = invite by registered email.
3. **No email verification** — Assignment focuses on core flows.
4. **JWT sessions** — Stateless auth compatible with Socket.io cookie check.
5. **Rounding** — Remainder cents assigned to payer keeps books balanced.
6. **Chat persistence** — Messages stored in DB; socket pushes new ones.
7. **Delete expense** — Not required; omitted to limit scope.
8. **Admin transfer** — Not required; creator stays admin.

---

## 9. Current repo state

**Last updated:** 2026-06-06 — dependency alignment and Socket.io auth type fix verified.

- Full-stack Next.js app with custom `server.ts` (Next + Socket.io).
- PostgreSQL schema migrated via `prisma/migrations/20250605000000_init`.
- 12 unit tests passing (`npm test`).
- Production build passes (`npm run build`).
- ESLint clean (`npm run lint`).
- Deploy via `render.yaml` (Render Web Service + Postgres).

### Verified commands

```bash
npm install               # eslint-config-next must match Next.js major (14.x)
npx prisma generate
npx prisma migrate dev    # requires running PostgreSQL
npm run db:seed           # optional demo data
npm test                  # 12 unit tests
npm run build
npm run dev               # http://localhost:3000 (custom server + Socket.io)
npm run lint
```

### Local dev requirement

PostgreSQL must be running and `DATABASE_URL` set in `.env` (see `.env.example`).

---

## 10. Key file map (target)

```
assignment/
├── AI_CONTEXT.md          ← this file
├── BUILD_PLAN.md
├── PROMPTS.md
├── README.md
├── prisma/schema.prisma
├── server.ts              ← Next + Socket.io entry
├── src/
│   ├── app/               ← pages & API routes
│   ├── components/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── balances.ts
│   │   ├── splits.ts
│   │   ├── prisma.ts
│   │   └── validations.ts
│   └── server/socket.ts
├── tests/
│   ├── splits.test.ts
│   └── balances.test.ts
├── package.json
└── render.yaml
```

---

## 11. Recreation checklist

To recreate this app:

1. Read this file and `BUILD_PLAN.md`.
2. `npm install` after scaffold.
3. Set `DATABASE_URL`, run `npx prisma migrate dev`.
4. `npm run dev` starts custom server on port 3000.
5. Register users, create group, add members, add expenses (try all 4 split types).
6. Verify balances update; record settlement; confirm chat live updates.
7. Run `npm test` — split and balance tests must pass.
## 12. Development timeline

1. Requirements were converted into a Splitwise-inspired MVP.
2. Database schema was designed first to keep expense relationships normalized.
3. Authentication and group management were implemented before financial logic.
4. Expense splitting algorithms were isolated into reusable utility modules and unit tested.
5. Balance calculation was implemented separately from storage to simplify reasoning.
6. Settlement logic was added on top of existing debt computation.
7. Real-time expense chat was integrated using Socket.io with persistent message storage.
8. Documentation and deployment configuration were finalized after production build verification.

## 13. Design decisions

- UUID primary keys avoid integer collisions and simplify distributed creation.
- Expense splits are stored as computed monetary values instead of recalculating every request.
- Settlement records are immutable financial events instead of directly modifying balances.
- Balance computation derives current state from expenses and settlements instead of storing running totals.
- Socket.io is used only for chat while all financial state changes remain HTTP based for consistency.
- JWT sessions reduce server-side session storage requirements.

## 14. Testing strategy

Business-critical logic is covered with unit tests.

Covered modules:
- Equal split calculation
- Unequal split validation
- Percentage split validation
- Share-based split calculation
- Group balance computation
- Cross-group balance aggregation

Manual verification:
- User registration
- User login
- Group creation
- Member management
- Expense creation
- Settlement recording
- Balance updates
- Expense chat
- Production build
- Render deployment