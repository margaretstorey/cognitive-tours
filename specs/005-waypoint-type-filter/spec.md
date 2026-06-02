# Feature Specification: Waypoint Type Filter

**Feature Branch**: `005-waypoint-type-filter`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Add a filter control to the graph that lets users show or hide waypoints by type. A "Filter" button in the top left of the graph canvas (near the existing "+ Add Waypoint" button) expands to show toggles for each waypoint type. Toggling a type hides all nodes of that type and their connected edges. Default is all types visible. State lives in ShrimpApp and is passed to WaypointGraph. No new API routes needed — purely UI state."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Focus on a Single Waypoint Type (Priority: P1)

A developer exploring a large graph wants to focus only on architectural decisions. They open the filter panel and deselect all types except ADR. The graph immediately shows only ADR nodes and the edges between them, hiding everything else.

**Why this priority**: This is the primary use case that motivates the feature — reducing graph clutter so a user can concentrate on one dimension of the project.

**Independent Test**: Can be fully tested by opening the filter panel, toggling a single type on while all others are off, and verifying only that type's nodes and their inter-edges remain visible.

**Acceptance Scenarios**:

1. **Given** all waypoint types are visible, **When** the user opens the filter panel and turns off all types except "ADR", **Then** only ADR nodes are shown on the graph canvas
2. **Given** only ADR nodes are shown, **When** the user re-enables "Feature", **Then** Feature nodes and their edges reappear immediately alongside ADRs
3. **Given** multiple types are toggled off, **When** a waypoint of a hidden type has an edge to a visible waypoint, **Then** that edge is also hidden

---

### User Story 2 — Hide Clutter to Surface High-Level Intent (Priority: P2)

A project has grown to 25+ waypoints and the graph is dense with Code Component nodes. The user hides Code Components and AI Instructions to focus on the intent layer: Goals, User Needs, and Features.

**Why this priority**: Directly addresses the known risk "Graph becomes too dense to navigate" — the highest-priority usability problem in the backlog.

**Independent Test**: Can be tested by hiding two or more types simultaneously and verifying the graph shows only the remaining types.

**Acceptance Scenarios**:

1. **Given** a graph with mixed waypoint types, **When** the user hides "Code Component", **Then** all Code Component nodes and their edges disappear
2. **Given** multiple types are hidden, **When** the user checks the graph, **Then** edges whose source or target is a hidden node are also hidden
3. **Given** types are hidden, **When** the user selects a waypoint in the detail panel that is still visible, **Then** it behaves normally (selection, detail view, edit)

---

### User Story 3 — Restore Full View (Priority: P3)

After filtering, the user wants to return to the complete graph. They can restore all types without having to toggle each one individually, or simply close and reopen the filter panel to confirm defaults.

**Why this priority**: Recovery from a filtered state should be easy — users should never feel trapped.

**Independent Test**: Can be tested by filtering some types out, then using a "Show All" action or individual toggles to restore, and verifying all waypoints reappear.

**Acceptance Scenarios**:

1. **Given** one or more types are hidden, **When** the user re-enables each type individually, **Then** nodes reappear in their original positions
2. **Given** the filter panel is open, **When** the user closes the app and returns (page refresh), **Then** all types are visible by default (filter does not persist across sessions)

---

### Edge Cases

- What happens when filtering hides every waypoint? (The graph canvas is empty — no nodes or edges shown; the filter panel remains accessible)
- What if the currently selected waypoint's type is toggled off? (The detail panel clears as if nothing is selected — the waypoint is no longer interactive while hidden)
- What if the active tour step points to a waypoint whose type is currently hidden? (Tour navigation continues to work; the graph does not highlight the hidden node, but the detail panel still shows the step content)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The graph canvas MUST include a "Filter" button positioned near the existing "+ Add Waypoint" button in the top-left area
- **FR-002**: Clicking the Filter button MUST expand a panel showing one toggle per waypoint type
- **FR-003**: Each toggle MUST display the waypoint type's name and colour indicator
- **FR-004**: All types MUST be toggled on (visible) by default when the app loads
- **FR-005**: Toggling a type off MUST immediately hide all waypoints of that type from the graph
- **FR-006**: When a waypoint is hidden, all edges whose source or target is that waypoint MUST also be hidden
- **FR-007**: Toggling a type back on MUST immediately restore all waypoints of that type (and their now-complete edges) in their original positions
- **FR-008**: The filter panel MUST be dismissible (clicking the button again or clicking outside closes it)
- **FR-009**: Filter state MUST live in the root application state and be passed down to the graph component — no local component state
- **FR-010**: Filtering MUST be purely a display concern — the underlying waypoint and edge data is unchanged
- **FR-011**: No new backend API routes are needed for this feature

### Key Entities

- **FilterState**: A record mapping each waypoint type to a boolean (visible/hidden). Contains one entry per type. All entries default to `true`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can isolate waypoints of a single type in under 5 seconds from opening the filter panel
- **SC-002**: The graph updates without any perceptible delay when a filter toggle is changed
- **SC-003**: All waypoint types present in the application (currently 9: Goal, User Need, Feature, ADR, Code Component, Test, Risk, AI Instruction, Open Question) appear as filter options
- **SC-004**: Hidden waypoints and their edges are completely absent from the visible graph — no ghost nodes or dangling edges
- **SC-005**: Re-enabling a type restores waypoints to their exact previous positions with no layout shift

## Assumptions

- Filter state is session-only and resets to "all visible" on page refresh — no persistence to the database
- The filter panel lists all waypoint types defined in the application's type system; adding a new type in future automatically appears in the filter without additional work (because the type list is derived from the source of truth)
- When a tour is active and the current step's waypoint type is hidden, the tour detail still renders but the graph node is not highlighted — tour functionality is not blocked
- The filter panel is positioned as an overlay/dropdown attached to the Filter button and does not restructure the existing three-panel layout
- Clicking outside the filter panel closes it (standard dropdown behaviour)
