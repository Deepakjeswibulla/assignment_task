# BUILD_PLAN.md — SplitShare Implementation Plan

# 1. Product Research

## Studying Splitwise

Before implementation, the core Splitwise workflows were analyzed to identify the minimum viable product suitable for a short internship assignment.

### Core workflows identified

* User authentication using email and password
* Creating groups for shared expenses
* Adding and removing members from groups
* Creating expenses with multiple split methods
* Viewing group balances
* Viewing overall individual balances
* Recording settlements between members
* Discussing expenses through real-time chat

### Product assumptions

To keep the scope realistic while preserving the primary user experience:

* Single currency per group
* Email acts as the unique user identifier
* No email verification
* No recurring expenses
* No receipt scanning
* No notifications
* No expense deletion flow
* Creator remains the permanent administrator

---

# 2. Architecture

## Technology Stack

| Layer          | Technology                           |
| -------------- | ------------------------------------ |
| Frontend       | Next.js 14 (App Router) + TypeScript |
| Styling        | Tailwind CSS                         |
| Backend        | Next.js Route Handlers               |
| Authentication | NextAuth Credentials + JWT           |
| Database       | PostgreSQL                           |
| ORM            | Prisma                               |
| Validation     | Zod                                  |
| Real-time      | Socket.io                            |
| Testing        | Vitest                               |
| Deployment     | Render                               |

## Database Design

The application uses a normalized relational schema consisting of:

* User
* Group
* GroupMember
* Expense
* ExpenseSplit
* Settlement
* ExpenseMessage

Relationships are designed to support flexible expense splitting while maintaining data consistency.

## API Design

REST endpoints provide:

* Authentication
* Group management
* Member management
* Expense creation
* Balance calculation
* Settlement recording
* Expense chat history

Socket.io provides real-time expense chat updates.

## Frontend Structure

Pages implemented:

* Login
* Register
* Dashboard
* Group Detail
* New Expense
* Expense Detail
* New Settlement

Business logic is separated into reusable libraries for:

* Split calculation
* Balance calculation
* Authentication
* Validation
* Database access

## Deployment

Deployment uses Render with:

* Render PostgreSQL
* Node Web Service
* Prisma migrations
* Custom server.ts for Next.js + Socket.io

---

# 3. AI Collaboration Process

AI was used as a development collaborator throughout the project.

The workflow followed was:

1. Define product scope.
2. Document requirements in AI_CONTEXT.md.
3. Produce an implementation roadmap.
4. Generate individual modules.
5. Review generated code.
6. Resolve dependency conflicts.
7. Configure PostgreSQL and Prisma.
8. Fix NextAuth version compatibility.
9. Validate build and deployment.
10. Deploy and verify production behavior.

AI-generated outputs were reviewed and modified when necessary to maintain consistency with the intended architecture.

AI_CONTEXT.md was continuously updated to remain the single source of truth for:

* Product scope
* Architecture
* Database schema
* API design
* Business logic
* Deployment decisions
* Trade-offs

---

# 4. Trade-offs

Several deliberate simplifications were made to keep the project achievable within the assignment timeline.

## Simplified

* Single currency support
* Email-based member addition
* JWT sessions
* Group creator remains administrator
* Expense chat scoped to individual expenses

## Avoided

* OAuth login
* Multi-currency conversion
* Push notifications
* Receipt OCR
* Recurring expenses
* Native mobile application
* Non-relational databases

## Future Improvements

With additional development time, the following features would be added:

* Live balance refresh without manual page reload
* Improved settlement form UX
* Admin transfer functionality
* Expense editing and deletion
* Group invitations via email
* Notifications
* Better responsive design
* Optimistic UI updates
* Enhanced integration tests

---

# 5. Verification Checklist

## Development

* Next.js application configured
* Prisma schema implemented
* PostgreSQL connected
* Authentication functional
* Expense split logic implemented
* Settlement logic implemented
* Socket.io chat implemented

## Testing

* Split calculation tests passing
* Balance calculation tests passing

## Production

* npm install
* prisma migrate
* npm test
* npm run build
* npm run dev

verified successfully.

## Deployment

Application successfully deployed on Render using PostgreSQL and a custom Node server with Socket.io support.

---

# 6. Final Status

All assignment requirements have been implemented:

* Authentication
* Group management
* Expense management
* Equal, unequal, percentage, and share splits
* Balance summaries
* Settlement recording
* Real-time expense chat
* Relational database
* Public deployment
* Documentation
* AI context preservation

The repository, deployed application, AI_CONTEXT.md, BUILD_PLAN.md, README.md, and supporting documentation together provide sufficient information for another engineer or AI system to recreate a substantially similar implementation.
