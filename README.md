# SplitShare

A Splitwise-inspired expense sharing web app built for an internship assignment. Users authenticate, create groups, add members, record expenses with flexible splits, view balances, record settlements, and discuss expenses via real-time chat.

## Features

- **Authentication** — Email/password registration and login (NextAuth)
- **Groups** — Create groups, add/remove members (admin only)
- **Expenses** — Four split modes: equal, unequal, percentage, share
- **Balances** — Per-group and cross-group individual summaries
- **Settlements** — Record payments between members
- **Real-time chat** — Expense-scoped discussion via Socket.io

## Tech stack

- Next.js 14 (App Router) + TypeScript
- PostgreSQL + Prisma ORM
- NextAuth.js v4 (credentials, JWT sessions)
- Socket.io (custom Node server)
- Tailwind CSS
- Vitest (unit tests)

## Quick start

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

```bash
# Clone and install
npm install

# Start PostgreSQL (optional — if you have Docker)
docker compose up -d

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and NEXTAUTH_SECRET

# Run migrations
npx prisma migrate dev

# Optional: seed demo data
npm run db:seed

# Start dev server (Next.js + Socket.io)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts (after seed)

| Email | Password |
|-------|----------|
| alice@example.com | password123 |
| bob@example.com | password123 |
| carol@example.com | password123 |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm test` | Run unit tests |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed demo data |

## Testing

```bash
npm test
```

Tests cover split calculation (all 4 modes) and balance/settlement math.

## Deployment (Render)

1. Push repo to GitHub.
2. Create a new **Blueprint** from `render.yaml`, or manually:
   - Create PostgreSQL database
   - Create Web Service with build: `npm install && npx prisma migrate deploy && npm run build`
   - Start: `npx tsx server.ts`
3. Set environment variables:
   - `DATABASE_URL` — from Render Postgres
   - `NEXTAUTH_SECRET` — random 32+ char string
   - `NEXTAUTH_URL` — your Render app URL (e.g. `https://splitshare.onrender.com`)

## Documentation

| File | Purpose |
|------|---------|
| [AI_CONTEXT.md](./AI_CONTEXT.md) | Complete product & technical spec (recreate-from-scratch guide) |
| [BUILD_PLAN.md](./BUILD_PLAN.md) | Implementation phases and checklist |
| [PROMPTS.md](./PROMPTS.md) | Key AI prompts used during development |

## Project structure

```
prisma/          Database schema and migrations
server.ts        Custom Node server (Next.js + Socket.io)
src/
  app/           Pages and API routes
  components/    React UI components
  lib/           Business logic (splits, balances, auth)
  server/        Socket.io setup
tests/           Vitest unit tests
```

## License

MIT — internship assignment submission.
# SplitShare

A Splitwise-inspired expense sharing web app built for an internship assignment.

## Live Demo

https://splitshare-new.onrender.com
