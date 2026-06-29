# ADR 002: Local React State with No Persistence for MVP

**Date:** 2026-05-21  
**Status:** Superseded by ADR 003 (SQLite + Prisma, then Turso for cloud)

---

## Context

Cognitive Tours needed to store waypoints, edges, and tours. Before 
committing to a persistence layer, the core concept needed validation: 
does the three-panel understanding map (graph + detail + tours) actually 
help developers navigate a project? Adding a database, ORM, migrations, 
and API routes before validating this would front-load infrastructure 
complexity that might need to change once we learned what users actually need.

---

## Decision

Use React `useState` with hard-coded mock data for all application state 
in the MVP. No server, no database, no API routes. All state resets on 
page refresh. Mock data represented Cognitive Tours itself as the example 
project.

---

## Consequences

**Positive:**
- Extremely fast to build — no database setup, migrations, or API layer
- Easy to understand — all state flows from a single root component
- No infrastructure to maintain during the validation phase
- Mock data designed to tell a compelling demo story (the app explaining itself)

**Negative:**
- Data does not persist across page refreshes — users lose work on reload
- Not usable for real projects until Phase 2 persistence was added
- Acceptable for MVP demo purposes; users were informed via a visible notice in the UI

---

## Superseded by

Phase 2 replaced local state with SQLite + Prisma (ADR not written at the 
time). Production deployment uses Turso for persistent cloud SQLite — 
see ADR 003.