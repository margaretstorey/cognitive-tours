# ADR 003: Use Turso for Cloud Persistence

**Status:** Accepted  
**Date:** 2026-06-02  
**Replaces:** ADR 002 (Local React State) — partially  
**Related:** ADR 002 (superseded local state), prisma/schema.prisma, app/lib/db.ts
** Author:** Claude 
---

## Context

Cognitive Tours was initially built with local SQLite via Prisma (Phase 2), 
which worked for local development but reset on every Vercel deployment 
because Vercel's filesystem is ephemeral. Data created in the running app 
would be lost on the next deploy.

The app needed a persistent cloud database that:
- Is SQLite-compatible (no schema changes, no ORM changes)
- Works with Vercel's serverless environment
- Requires minimal setup and no separate database server
- Is free or very low cost for a single-user research tool

---

## Decision

Use Turso — a hosted SQLite service — for production persistence.

Turso provides a SQLite-compatible HTTP API that works in Vercel's serverless 
functions. The local development environment continues to use local SQLite 
(`prisma/dev.db`). The switch between local and Turso is handled in 
`app/lib/db.ts` via environment variables.

---

## Consequences

**Positive:**
- Data survives Vercel deployments and is shared across all users of the 
  live app
- No schema changes required — Turso is SQLite-compatible
- No ORM changes required — Prisma continues to work via the Turso adapter
- Free tier is sufficient for current usage

**Negative:**
- Local and production databases are separate — local dev does not reflect 
  live data unless `.env` is pointed at Turso directly
- Turso data must be backed up manually (visit /api/data and save the JSON)
- Vercel Git connection can silently disconnect — see CLAUDE.md Known Issues

---

## Implementation

- `app/lib/db.ts` — switches between local SQLite and Turso based on 
  `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` environment variables
- `.env` — holds Turso credentials for local use (gitignored)
- Vercel project settings — environment variables set in dashboard

---

## Alternatives Considered

- **PostgreSQL (Vercel Postgres or Supabase)** — rejected; would require 
  schema and ORM changes, and adds complexity not justified for a 
  single-user tool
- **Planetscale / Railway** — rejected for same reasons
- **Keep local SQLite, redeploy with data baked in** — rejected; fragile 
  and not suitable for a shared live app