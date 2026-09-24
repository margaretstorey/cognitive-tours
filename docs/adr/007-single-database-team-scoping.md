# ADR 007: One Database with Team-Scoped Rows

**Status:** Accepted  
**Date:** 2026-09-24  
**Related:** spec 009 (`specs/009-multi-user-support/spec.md`, FR-006, FR-007, SC-007), issue #10, ADR 003 (Use Turso), ADR 005 (SQLite + Prisma persistence)  
**Author:** Margaret-Anne Storey (decision), Claude (write-up)

---

## Context

Spec 009 adds team spaces for the Startup Studio course (Fall 2026): each
team works in its own space, reached via its own link. Today the app has a
single global dataset: `GET /api/data` loads every waypoint, edge and tour,
and nothing in `prisma/schema.prisma` records which team or project a row
belongs to.

The spec leaves the isolation model as a planning decision, constrained by:

- **FR-006**: everything a team creates belongs to exactly one team space
  and appears only there.
- **FR-007**: actions in one team space never change another team space
  or the existing self-documentation map.
- **SC-007**: the instructor overview of all teams loads in under 3 seconds
  with 12 teams.

Expected scale is small: about 12 teams of 3–6 students, each with up to
about 100 waypoints and 20 tours.

---

## Decision

Keep **one database**: Turso in production and SQLite locally, exactly as
today (ADR 003, ADR 005). Add a **team-space identifier to every
team-owned row** (waypoints, edges, tours and tour stops), and scope every
read and write by it.

The existing Cognitive Tours self-documentation map becomes one space
among the others, so it stays intact and reachable (spec FR-025).

---

## Consequences

**Positive:**
- The instructor overview is a single query across teams (SC-007).
- One schema change, one backup (`/api/data`), one seed path
  (`scripts/seed-from-backup.ts`), one set of Turso credentials.
- No new infrastructure. Consistent with Principle I (Simplicity Over
  Complexity).

**Negative:**
- **The main risk: a query that forgets its team filter.** In one shared
  database, a single unscoped query could show or change another team's
  data, breaking FR-007. Isolation depends on code discipline, not on
  separate storage.
- A bad schema change or a bad deploy affects every team at once.
- One database is one blast radius for backups and restores: restoring
  one team means restoring selectively from a full backup.

**Mitigations:**
- **All reads and writes go through one team-scoped data-access layer**
  that takes the team space as a required argument, rather than each API
  route adding its own filter.
- **A Playwright test** proves that a waypoint, edge or tour created in
  Team A never appears in, or changes, Team B.
- The database enforces relationships with foreign keys where Prisma
  supports it (this also fixes the existing dangling-edge risk noted on
  issue #10).
- Back up `/api/data` before any schema change that touches team scoping.

---

## Alternatives Considered

- **A separate Turso database per team** — rejected. The instructor
  overview would need 12+ connections. Schema changes, backups and the seed
  script would all multiply, and creating a team space would mean creating
  a database. The hard isolation it offers isn't needed: spec 009 already
  accepts that teams stay out of each other's spaces by class norm
  (readable links, no login).
- **Separate tables per team** — rejected. The schema would change
  whenever a team is added, and it offers no real isolation gain over
  row-level scoping.

---

## Revisit If

- Teams need **hard isolation**, for example verified privacy or grading
  integrity, which would also change spec 009's access decision.
- Data grows well beyond the course scale (many cohorts, or thousands of
  waypoints per team).
- An approved research protocol (spec FR-020 and FR-026) requires
  research data to be stored separately.
