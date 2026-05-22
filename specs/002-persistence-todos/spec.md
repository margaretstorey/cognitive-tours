# Feature Specification: Phase 2 — Persistence

**Feature Branch**: `002-persistence-todos`

**Created**: 2026-05-21

**Status**: Draft

**Input**: User description: "Phase 2: Add persistence with SQLite and Prisma, add Todo waypoint type with Open/In Progress/Done status, and enable Todo Tours — a tour made of Todo waypoints that acts as a prioritized task list."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Data Survives a Page Refresh (Priority: P1)

A user creates waypoints, draws connections, and builds tours. When they reload the page, all their
work is exactly as they left it — nothing is lost. They can return the next day and continue where
they stopped.

**Why this priority**: Persistence is the foundational requirement of Phase 2. Without it, every
other new feature is undermined — custom tours and any real project work would vanish on every
reload. This is the single most impactful change in the phase.

**Independent Test**: Create two waypoints and one tour, reload the page, verify all three items
are present with the same content and connections.

**Acceptance Scenarios**:

1. **Given** a user has created waypoints and tours, **When** they reload the page, **Then** all
   waypoints, edges, and tours are restored exactly as created.
2. **Given** a user edits a waypoint's description, **When** they reload, **Then** the updated
   description is shown — not the original.
3. **Given** a user deletes a waypoint, **When** they reload, **Then** the deleted waypoint does
   not reappear.
4. **Given** a user creates a connection between two waypoints, **When** they reload, **Then** the
   edge is still present in the graph.

---

### Edge Cases

- What happens to existing waypoints and tours on first load after persistence is added? All
  existing mock data is migrated or replaced by seeded data in the database; the user is not
  expected to manually migrate.
- What happens if the database file is missing or corrupted? The app MUST display a clear error
  message and MUST NOT silently lose data or crash without feedback.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All waypoints, edges, and tours MUST be persisted across page refreshes and browser
  sessions.
- **FR-002**: The app MUST load persisted data on startup; no data created in a previous session
  MUST be lost on reload.
- **FR-003**: All create, update, and delete operations on waypoints, edges, and tours MUST be
  durably saved before the operation is considered complete from the user's perspective.
- **FR-004**: The app MUST seed the database with the existing Shrimp mock data on first run
  (when the database is empty), so new users see the sample understanding map without manual setup.
- **FR-005**: If the persistence layer is unavailable or returns an error, the app MUST display a
  clear, user-visible error message and MUST NOT silently fail or show stale data.

### Key Entities

- **Waypoint**: unchanged from Phase 1.
- **WaypointEdge**: unchanged from Phase 1.
- **Tour**: unchanged from Phase 1.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user's waypoints, edges, and tours are present after a page reload in 100% of
  normal operating conditions (no data loss on refresh).
- **SC-002**: First load of a new database (with seed data) completes and renders the full
  understanding map in under 3 seconds.

## Assumptions

- This phase adds persistence to the existing single-user, single-session application. Multi-user
  or real-time collaboration is out of scope.
- The database runs locally alongside the Next.js application; no cloud database or external
  service is required for this phase.
- Existing Phase 1 mock data (`INITIAL_WAYPOINTS`, `INITIAL_EDGES`, `INITIAL_TOURS`) is used as
  the database seed on first run. After seeding, mock data imports are no longer the source of
  truth — the database is.
- Authentication and multi-project support are explicitly out of scope for this phase.
- Waypoint position in the graph (x/y coordinates) is also persisted, so the graph layout
  survives a reload.
