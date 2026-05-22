# Research: Phase 2 — Persistence

**Feature**: `002-persistence-todos` | **Date**: 2026-05-21

## Decision 1: SQLite + Prisma as the persistence stack

**Decision**: Use SQLite as the database file and Prisma ORM as the access layer.

**Rationale**: The spec explicitly names this stack. SQLite requires zero server setup — the
database is a single file (`prisma/dev.db`) that lives in the repository alongside the app.
Prisma provides a strongly-typed generated client, a schema-first migration system, and
first-class TypeScript support. Together they are the minimal viable persistence layer for a
local-first, single-user app.

**Alternatives considered**:
- PostgreSQL / MySQL: require a running server process; excessive for local single-user use.
- Better-SQLite3 (raw): no ORM, manual SQL strings, no migration tooling — more work, less
  type safety.
- JSON file storage: simpler but no transaction safety, harder to query, not a real DB.

---

## Decision 2: REST Route Handlers over Server Actions

**Decision**: Use Next.js Route Handlers (`app/api/**/route.ts`) for all CRUD operations rather
than Server Actions (`'use server'` functions).

**Rationale**: The optimistic update pattern requires imperative async calls from event handlers
in a Client Component. Server Actions are designed for form `action=` and React's `useActionState`
hook — they work best with the form-submit → response cycle. Route Handlers called via `fetch`
from event handlers give the same mutation semantics but with explicit request/response control,
making it straightforward to snapshot-and-revert on failure. Route Handlers also match the
mental model of a REST API, which is easier to reason about and test independently.

**Alternatives considered**:
- Server Actions: would work for simple mutations but require `'use server'` directive in
  separate files and add indirection between the optimistic state update and the async call.
  The snapshot-revert pattern is harder to implement cleanly with `useTransition`/`useOptimistic`
  in React 19 when all state lives in a single `ShrimpApp` component.
- tRPC or similar: adds a dependency and abstraction layer not justified by current scope
  (Constitution Principle I).

---

## Decision 3: Single bulk GET for startup load

**Decision**: `GET /api/data` returns all waypoints, edges, and tours in one response. On startup,
`ShrimpApp` makes exactly one fetch call to populate state.

**Rationale**: With ~12–30 waypoints and 2–3 tours, all data fits comfortably in a single JSON
response. A single round trip is faster than three parallel requests (no waterfall, no partial
renders). It also simplifies the loading state machine — there is one transition from `loading`
to `ready`, not three.

**Alternatives considered**:
- Three separate fetches (GET /api/waypoints, GET /api/edges, GET /api/tours) in parallel: more
  network calls, more complex loading state, no benefit at this scale.
- React Suspense with Server Components: would require lifting the data-fetch into a Server
  Component and passing it as props to ShrimpApp, fundamentally restructuring the Phase 1
  component architecture. Not worth the refactor.

---

## Decision 4: Client-generated IDs

**Decision**: IDs are generated client-side (timestamp-based strings: `w-${Date.now()}`) and
sent to the API with the create request. The database uses `String @id` (not auto-increment).

**Rationale**: Phase 1 already uses client-generated IDs. Changing to server-assigned IDs would
require the optimistic update to use a temporary ID and then reconcile with the real ID after the
response — adding complexity with no benefit at single-user scale.

**Alternatives considered**:
- Auto-increment integers: would require ID reconciliation on the client after every create.
- Server-generated UUIDs: same problem. The spec does not require globally unique IDs.

---

## Decision 5: Prisma client singleton pattern for Next.js dev

**Decision**: Use a global-cached Prisma client in development to survive hot-reload module
re-instantiation. In production, create a single instance at module load time.

**Rationale**: Next.js `next dev` can re-evaluate module code on file changes, creating multiple
Prisma client instances that each hold an open SQLite connection. The singleton pattern — checking
`global.prisma` before creating a new instance — prevents connection pool exhaustion in
development. This is the pattern documented in the Prisma + Next.js integration guide.

**Alternatives considered**:
- New client per request: safe but wastes connection overhead and risks hitting SQLite's
  single-writer limit.
- Connection pooling middleware (PgBouncer etc.): only relevant for PostgreSQL, not SQLite.

---

## Decision 6: TourWaypoint join table for ordered waypoint lists

**Decision**: Model the ordered `waypointIds` array on `Tour` as a separate `TourWaypoint`
join table with an `order` integer column.

**Rationale**: Prisma does not support storing an ordered array of scalars as a column in SQLite.
Storing a comma-separated string would be fragile and unqueryable. A join table with an explicit
`order` column is the standard relational approach and integrates cleanly with Prisma's include
syntax.

**Alternatives considered**:
- JSON column: Prisma SQLite supports `Json` type but it is a blob and cannot be queried or
  indexed. Harder to maintain referential integrity.
- CSV string: brittle, no referential integrity, requires custom parsing.
