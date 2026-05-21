# Feature Specification: Phase 2 — Persistence, Todo Waypoints, and Todo Tours

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
other new feature is undermined — Todo statuses, custom tours, and any real project work would
vanish on every reload. This is the single most impactful change in the phase.

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

### User Story 2 - Create and Manage Todo Waypoints (Priority: P2)

A user creates a waypoint of the new "Todo" type. Each Todo waypoint has a status: Open, In
Progress, or Done. The user can change a Todo's status directly from the detail panel without
opening the edit form. The status is visually distinct in the graph — Open, In Progress, and Done
todos look different at a glance.

**Why this priority**: The Todo waypoint type is the key new concept of this phase. It turns Shrimp
from a read-only understanding map into an actionable task layer, directly expressing Constitution
Principle VI (Waypoints are Universal).

**Independent Test**: Create three Todo waypoints — one Open, one In Progress, one Done. Verify all
three appear in the graph with visually distinct styles. Change the Open one to Done and verify the
graph node updates immediately.

**Acceptance Scenarios**:

1. **Given** the user opens the "Add Waypoint" form, **When** they select type "Todo", **Then**
   a status field appears with options: Open, In Progress, Done (default: Open).
2. **Given** a Todo waypoint is selected, **When** the detail panel is shown, **Then** the current
   status is displayed and a status-change control (dropdown or button group) is visible.
3. **Given** the user changes a Todo's status to "In Progress", **When** they view the graph,
   **Then** the node's visual style reflects "In Progress" distinctly from Open and Done.
4. **Given** a Todo waypoint's status is changed, **When** the user reloads, **Then** the new
   status is persisted.
5. **Given** a Todo waypoint exists, **When** the user edits it via the edit form, **Then** the
   status field is included and editable.

---

### User Story 3 - Use a Todo Tour as a Prioritized Task List (Priority: P3)

A user creates a tour consisting entirely of Todo waypoints. In this "Todo Tour" mode, the tour
displays like a task list: showing each Todo's status alongside its title, with a visual progress
indicator (e.g., "3 of 7 done"). The user can advance through the tour and mark Todos complete
directly from the tour navigation bar.

**Why this priority**: Todo Tours are the highest-level feature — they bring together persistence
(P1) and Todo waypoints (P2) into a coherent task management experience. They are independently
valuable but depend on the two prior stories being stable first.

**Independent Test**: Create a tour with four Todo waypoints (2 Open, 1 In Progress, 1 Done).
Select the tour. Verify the tour bar shows "1 of 4 done" (or equivalent). Mark one Open todo as
Done from the tour bar. Verify the count updates to "2 of 4 done" and the graph node updates.

**Acceptance Scenarios**:

1. **Given** a tour contains only Todo waypoints, **When** the user selects it, **Then** the tour
   bar displays a progress summary (e.g., "N of M done").
2. **Given** a Todo Tour is active, **When** the user views the current step, **Then** the Todo's
   status is visible in the detail panel and changeable without leaving the tour.
3. **Given** a user marks a Todo as Done while in a Todo Tour, **When** they view the progress
   summary, **Then** the done count increments immediately.
4. **Given** a tour contains a mix of Todo and non-Todo waypoints, **When** the user selects it,
   **Then** it behaves as a normal tour (no task-list mode); the progress summary is only shown
   when all waypoints in the tour are of type Todo.
5. **Given** all Todos in a Todo Tour are marked Done, **When** the user views the tour bar,
   **Then** a completion indicator is shown (e.g., "All done ✓").

---

### Edge Cases

- What happens to existing waypoints and tours on first load after persistence is added? All
  existing mock data is migrated or replaced by seeded data in the database; the user is not
  expected to manually migrate.
- What happens if the database file is missing or corrupted? The app MUST display a clear error
  message and MUST NOT silently lose data or crash without feedback.
- What if a Todo Tour's waypoints are reordered and some become non-Todo types? The tour reverts
  to normal tour mode (no progress summary) if any waypoint is not a Todo.
- What if a Todo waypoint is deleted while it is part of an active Todo Tour? Cascade delete
  applies (established in Phase 1); the tour step is removed and the progress summary recalculates.
- What if a user changes a waypoint's type from Todo to another type while it is in a Todo Tour?
  The tour reverts to normal tour mode if any waypoint is now a non-Todo type.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All waypoints, edges, and tours MUST be persisted across page refreshes and browser
  sessions.
- **FR-002**: The app MUST load persisted data on startup; no data created in a previous session
  MUST be lost on reload.
- **FR-003**: All create, update, and delete operations on waypoints, edges, and tours MUST be
  durably saved before the operation is considered complete from the user's perspective.
- **FR-004**: The app MUST support a new waypoint type: "Todo", in addition to the existing eight
  types.
- **FR-005**: Every "Todo" waypoint MUST have a status field with exactly three values: Open,
  In Progress, Done. Default status on creation is Open.
- **FR-006**: The status of a Todo waypoint MUST be changeable directly from the detail panel
  without opening the full edit form.
- **FR-007**: Todo waypoints MUST be visually distinguished in the graph by their status: Open,
  In Progress, and Done MUST have distinct visual treatments.
- **FR-008**: Todo waypoint status changes MUST be persisted immediately.
- **FR-009**: A tour whose waypoints are all of type "Todo" MUST display a progress summary in
  the tour bar showing how many waypoints are marked Done out of the total.
- **FR-010**: While navigating a Todo Tour, the user MUST be able to change the current waypoint's
  Todo status directly from the tour navigation area (without leaving the tour).
- **FR-011**: A tour containing any non-Todo waypoint MUST behave as a standard tour with no
  progress summary.
- **FR-012**: The app MUST seed the database with the existing Shrimp mock data on first run
  (when the database is empty), so new users see the sample understanding map without manual setup.
- **FR-013**: If the persistence layer is unavailable or returns an error, the app MUST display a
  clear, user-visible error message and MUST NOT silently fail or show stale data.

### Key Entities

- **Waypoint** (extended): adds `status` field (`'Open' | 'In Progress' | 'Done' | null`) — null
  for all non-Todo types; required for Todo type.
- **TodoStatus**: enumeration of `Open`, `In Progress`, `Done` — applies only to Todo waypoints.
- **WaypointEdge**: unchanged from Phase 1.
- **Tour**: unchanged from Phase 1; gains derived property `isTodoTour` (true when all
  `waypointIds` reference Todo-type waypoints).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user's waypoints, edges, and tours are present after a page reload in 100% of
  normal operating conditions (no data loss on refresh).
- **SC-002**: A user can change a Todo waypoint's status in under 5 seconds with no more than
  two interactions (click the status control, select the new value).
- **SC-003**: A Todo Tour with 10 waypoints shows an accurate progress count at all times — the
  count MUST update within 1 second of a status change.
- **SC-004**: The three Todo statuses (Open, In Progress, Done) are visually distinguishable in
  the graph at a glance — a user can correctly identify each status without reading labels in at
  least 80% of cases during informal testing.
- **SC-005**: First load of a new database (with seed data) completes and renders the full
  understanding map in under 3 seconds.

## Assumptions

- This phase adds persistence to the existing single-user, single-session application. Multi-user
  or real-time collaboration is out of scope.
- The database runs locally alongside the Next.js application; no cloud database or external
  service is required for this phase.
- Existing Phase 1 mock data (`INITIAL_WAYPOINTS`, `INITIAL_EDGES`, `INITIAL_TOURS`) is used as
  the database seed on first run. After seeding, mock data imports are no longer the source of
  truth — the database is.
- The "Todo" type is added to the existing waypoint type taxonomy (joining the eight types from
  Phase 1). It is the ninth type.
- Authentication and multi-project support are explicitly out of scope for this phase.
- The existing cascade-delete behaviour (Phase 1) applies to Todo waypoints and their tour
  memberships without modification.
- Waypoint position in the graph (x/y coordinates) is also persisted, so the graph layout
  survives a reload.
