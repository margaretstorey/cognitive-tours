# Feature Specification: Tour Focus Mode and Edge Labels

**Feature Branch**: `004-tour-focus-edge-labels`

**Created**: 2026-05-22

**Status**: Draft

**Input**: User description: "Two graph UX improvements: (1) Tour Focus Mode — when a tour is active, waypoints not in the tour are dimmed to ~20% opacity; edges between non-tour nodes also dimmed; full opacity when no tour is selected. (2) Edge Labels — existing labels should be visible on the graph, and users should be prompted to optionally add a label when creating a new connection."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Focus on a Tour Without Losing the Map (Priority: P1)

A user selects a tour to follow. The graph immediately dims all waypoints that are not part of
that tour — they are still visible but faint, preserving spatial context while drawing attention
to the tour path. When the user deselects the tour, all waypoints return to full visibility.

**Why this priority**: Tour focus mode is a navigation aid that directly serves the core use
case: guiding someone through a curated path in a complex graph. Without dimming, a large map
makes it hard to track which nodes are part of the current tour. This improvement has immediate
value for any project with more than ~6 waypoints.

**Independent Test**: Create 5 waypoints and one tour containing 2 of them. Select the tour.
Verify the 3 non-tour waypoints appear visually faint and the 2 tour waypoints remain at full
opacity. Deselect the tour; verify all 5 waypoints return to full opacity.

**Acceptance Scenarios**:

1. **Given** a tour is active, **When** the graph renders, **Then** waypoints not in the tour
   are displayed at approximately 20% opacity.
2. **Given** a tour is active, **When** the graph renders, **Then** edges whose source AND
   target are both outside the tour are also displayed at approximately 20% opacity.
3. **Given** a tour is active, **When** the user deselects the tour (sets "No tour selected"),
   **Then** all waypoints and edges return to full opacity immediately.
4. **Given** a tour with zero waypoints is selected, **When** the graph renders, **Then** all
   waypoints are dimmed (the tour contains no nodes, so none qualify as "in the tour").

---

### User Story 2 — See and Add Labels on Connections (Priority: P2)

A user looks at the graph and can read labels on connections that have them (e.g., "depends on",
"implements", "owns"). When they drag to create a new connection between two waypoints, a small
prompt appears where they can optionally type a label for that edge before it is saved. They can
skip the label to create an unlabelled connection, just as before.

**Why this priority**: Edge labels give connections meaning. Without them, every connection looks
the same and the map loses semantic depth. Making existing labels visible is a low-cost,
high-value change. The label prompt on creation is a natural extension — users should be able to
annotate new edges without navigating away.

**Independent Test**: (a) Create a waypoint connection, add label "depends on" via the prompt,
verify the label appears on the graph edge. (b) Create another connection and dismiss the prompt
without typing — verify the unlabelled connection is created normally with no label shown.

**Acceptance Scenarios**:

1. **Given** an edge has a label, **When** the graph renders, **Then** the label is visible on
   or near that edge in the graph.
2. **Given** an edge has no label, **When** the graph renders, **Then** no label text is shown
   for that edge (the connection is still visible).
3. **Given** a user drags to connect two waypoints, **When** the connection is released,
   **Then** a prompt appears where they can type an optional edge label.
4. **Given** the edge label prompt is open, **When** the user submits a label (or confirms empty),
   **Then** the edge is created with that label (or no label), the prompt closes, and the edge
   appears on the graph.
5. **Given** the edge label prompt is open, **When** the user cancels or dismisses it, **Then**
   no edge is created.

---

### Edge Cases

- What if a tour waypoint is connected to a non-tour waypoint? That edge is treated as "in the
  tour" and remains at full opacity (at least one endpoint is a tour node).
- What if the graph has no edges? Tour focus mode still dims non-tour nodes; the absence of
  edges changes nothing.
- What if the user types nothing in the edge label prompt and confirms? The edge is created with
  no label — identical to the current behaviour for connections.
- What if an edge label is very long? The label is truncated or wrapped to fit; it does not
  occlude other graph elements.

## Requirements *(mandatory)*

### Functional Requirements

**Tour Focus Mode (US1)**

- **FR-001**: When a tour is active, waypoints that are NOT in the tour's waypoint list MUST be
  displayed at reduced opacity (approximately 20%).
- **FR-002**: When a tour is active, edges whose source AND target waypoints are BOTH outside
  the tour MUST be displayed at the same reduced opacity as non-tour waypoints.
- **FR-003**: Edges where at least one endpoint is a tour waypoint MUST remain at full opacity.
- **FR-004**: When no tour is selected, all waypoints and edges MUST be displayed at full opacity.
- **FR-005**: The opacity change MUST take effect immediately when a tour is selected or
  deselected — no delay or animation required.

**Edge Labels (US2)**

- **FR-006**: If an edge has a non-empty label, the label text MUST be visible on the graph
  canvas, positioned near the midpoint of the edge.
- **FR-007**: If an edge has no label, no label text is displayed for that edge.
- **FR-008**: When a user completes a drag-to-connect action (connecting two waypoints), a
  prompt MUST appear asking for an optional edge label before the connection is saved.
- **FR-009**: The prompt MUST allow the user to submit with an empty label (creating an
  unlabelled edge) or to cancel (preventing the edge from being created).
- **FR-010**: After the prompt is submitted, the edge MUST appear on the graph with its label
  (if any) visible immediately.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When a tour is active, 100% of non-tour waypoints are visually distinguishable
  from tour waypoints by reduced opacity — verifiable by visual inspection.
- **SC-002**: All edges with existing labels display their label text in the graph — verifiable
  by checking every labelled edge in the mock dataset.
- **SC-003**: A user can add a label to a new edge in a single interaction (drag + prompt +
  confirm) without navigating to any other screen.
- **SC-004**: Toggling a tour on and off returns the graph to its expected visual state in 100%
  of attempts — verifiable by repeated toggle test.

## Assumptions

- "Approximately 20% opacity" means the non-tour nodes are clearly readable but visually
  secondary to tour nodes; the exact value may be adjusted during implementation for visual
  clarity, staying in the 15–30% range.
- A "mixed" edge (one endpoint in the tour, one outside) remains at full opacity — this keeps
  the tour path's outgoing connections visible.
- The edge label prompt is a simple inline or modal text field — no rich formatting, no
  autocomplete, no character limit.
- Cancelling the edge label prompt cancels the entire edge creation (the drag-connect action
  is not committed without user confirmation via the prompt).
- Existing unlabelled edges are unaffected by the label display change (no empty label element
  is rendered).
- No changes to data persistence are required for either feature — both changes are presentation
  and interaction only (except that the label entered in the prompt must be passed to the
  existing `addEdge` handler, which already supports a `label` field).
