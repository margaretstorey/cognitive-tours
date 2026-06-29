# ADR 005: SQLite + Prisma for Local Persistence

**Status:** Accepted (production uses Turso — see ADR 003)  
**Date:** 2026-05-22  
**Related:** ADR 002 (superseded local state), ADR 003 (Turso for cloud)

---

## Context

Phase 1 validated the core concept with local React state and mock data 
(ADR 002). Phase 2 needed real persistence so that waypoints, edges, and 
tours survived page refresh. The app is single-user with no need for a 
server database at this stage.

---

## Decision

Use SQLite via Prisma ORM for local persistence.

SQLite runs in-process, requires no setup or separate server, and Prisma 
provides type-safe queries and schema migrations. We started simple — 
local SQLite only, no cloud deployment in mind initially.

After adding Turso for cloud deployment, Prisma continued to work unchanged 
— Turso is SQLite-compatible so only the connection string changed, not 
the ORM or schema.

---

## Consequences

**Positive:**
- No database server to run or maintain locally
- Prisma provides type-safe queries and migration tooling
- SQLite-compatible with Turso — no ORM changes needed for cloud deployment
- schema.prisma is the single source of truth for the data model

**Negative:**
- SQLite not suitable for Vercel's ephemeral filesystem — resolved by 
  Turso (see ADR 003)
- Single-user only — not suitable for multi-user collaboration without 
  migrating to PostgreSQL or similar

---

## Implementation

- `prisma/schema.prisma` — defines Waypoint, Edge, Tour, TourWaypoint tables
- `app/lib/db.ts` — switches between local SQLite and Turso via environment variables
- `app/lib/db-mappers.ts` — translates Prisma rows to AppState types