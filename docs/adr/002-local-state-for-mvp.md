# ADR 002: Local React State with No Persistence for MVP

**Date**: 2026-05-21
**Status**: Superseded (will be replaced by SQLite + Prisma in Phase 2)

## Context

Shrimp 2.0 needs to store waypoints, edges, and tours. Before committing to a persistence layer, we need to validate the core concept: does the three-panel understanding map (graph + detail + tours) actually help developers navigate a project? Adding a database, ORM, migrations, and API routes before validating this would front-load infrastructure complexity that may need to change once we learn what users actually need.

## Decision

Use React `useState` with hard-coded mock data for all application state in the MVP. No server, no database, no API routes. All state resets on page refresh. Mock data represents Shrimp itself as the example project.

## Consequences

**Positive**:
- Extremely fast to build — no database setup, migrations, or API layer
- Easy to understand — all state flows from a single root component (`ShrimpApp`)
- No infrastructure to maintain during the validation phase
- Mock data can be designed to tell a compelling demo story (Shrimp explaining itself)

**Negative**:
- Data does not persist across page refreshes — users lose work on reload
- Not usable for real projects until Phase 2 persistence is added
- Acceptable for MVP demo purposes; users are informed via a visible notice in the UI
