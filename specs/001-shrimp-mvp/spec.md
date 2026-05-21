# Feature Specification: Shrimp 2.0 MVP — Understanding Map

**Feature Branch**: `001-shrimp-mvp`

**Created**: 2026-05-21

**Status**: Draft

**Input**: User description: "Build Shrimp 2.0 MVP: a lightweight understanding map for software projects. Waypoints are meaningful places in a software project that help a human understand intent, rationale, architecture, tests, risks, or AI instructions. Tours are ordered paths through waypoints that guide understanding. The first version is manual: users create waypoints, connect them, and build tours. The app should have a graph view on the left, a waypoint detail panel on the right, and a tour selector at the top. Waypoint types: User Need, Feature, ADR, Code Component, Test, Risk, AI Instruction, Open Question. Two sample tours: New Developer Orientation and Why Waypoints and Tours Exist. Do not implement authentication, GitHub integration, AI summarization, repo parsing, or database persistence yet. Use mock data and local state only."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explore the Understanding Map (Priority: P1)

A new contributor opens Shrimp 2.0 and sees a project's understanding map: a graph of waypoints on the
left and a detail panel on the right. They select a waypoint to read its title, type, and description.
They browse the graph to get a feel for the project's structure and intent without reading any code.

**Why this priority**: This is the core read experience. Without it, none of the other features
deliver value. A visitor must be able to explore an existing map before creating or editing anything.

**Independent Test**: Load the app with pre-populated mock data. Verify the graph renders with all
sample waypoints visible, clicking a node populates the detail panel with that waypoint's information.

**Acceptance Scenarios**:

1. **Given** the app loads with sample data, **When** the user views the page, **Then** a graph of
   waypoints is visible on the left and a detail panel is visible on the right.
2. **Given** the graph is visible, **When** the user clicks a waypoint node, **Then** the detail panel
   shows that waypoint's type, title, and description.
3. **Given** a waypoint is selected, **When** the user clicks a different waypoint, **Then** the detail
   panel updates to reflect the newly selected waypoint.
4. **Given** the graph is visible, **When** the user examines the nodes, **Then** each node's visual
   style clearly indicates its type (User Need, Feature, ADR, Code Component, Test, Risk,
   AI Instruction, Open Question).

---

### User Story 2 - Follow a Guided Tour (Priority: P2)

A user selects a tour from the tour selector at the top of the screen. The tour steps them through an
ordered sequence of waypoints. They can move forward and backward through the tour, with the graph
highlighting the current waypoint and the detail panel showing its content.

**Why this priority**: Tours are Shrimp's primary mechanism for guided understanding — they transform
a static map into a narrative. This is the feature that differentiates Shrimp from a plain diagram tool.

**Independent Test**: Load the app with the two sample tours. Select "New Developer Orientation",
advance through all its steps, and verify each step highlights the correct waypoint and shows the
correct detail content.

**Acceptance Scenarios**:

1. **Given** the app is loaded, **When** the user opens the tour selector, **Then** the two sample
   tours ("New Developer Orientation" and "Why Waypoints and Tours Exist") are listed.
2. **Given** a tour is selected, **When** the first step loads, **Then** the corresponding waypoint
   is highlighted in the graph and its details appear in the panel.
3. **Given** a tour is in progress, **When** the user clicks Next, **Then** the next waypoint in the
   tour becomes selected and the detail panel updates.
4. **Given** the user is past the first step, **When** the user clicks Previous, **Then** the prior
   waypoint becomes selected and shown.
5. **Given** the user reaches the last step, **When** they view the UI, **Then** a clear end-of-tour
   indication is shown and Next is disabled or replaced with a "Finish" action.

---

### User Story 3 - Create and Edit a Waypoint (Priority: P3)

A user creates a new waypoint by providing a title, choosing a type from the eight supported types,
and writing a description. They can later select the waypoint, edit its title, type, or description,
and save the change. The graph updates to reflect the new or edited waypoint immediately.

**Why this priority**: Manual creation is the only data entry mechanism for the MVP. Without it the
map is read-only and cannot grow. However, exploring the sample data (P1) and touring it (P2) are
viable MVPs on their own, so creation comes third.

**Independent Test**: Create a new waypoint of type "Risk" with a title and description. Verify it
appears in the graph. Select it, edit the description, save, and verify the detail panel reflects
the change.

**Acceptance Scenarios**:

1. **Given** the user is on the main screen, **When** they trigger the "Add Waypoint" action,
   **Then** a form or panel appears to enter the waypoint's title, type, and description.
2. **Given** the form is filled with a title, type, and description, **When** the user saves,
   **Then** the new waypoint appears in the graph and the form closes.
3. **Given** a waypoint exists in the graph, **When** the user selects it and triggers edit,
   **Then** an editable form pre-populated with the waypoint's current values appears.
4. **Given** the user edits and saves, **Then** the detail panel and graph node reflect the updated values.
5. **Given** the user triggers edit but then cancels, **Then** no changes are applied.

---

### User Story 4 - Connect Waypoints (Priority: P4)

A user draws a connection between two waypoints in the graph to express a relationship (e.g., a Feature
depends on a User Need). The connection appears as a visible edge in the graph. The user can also remove
a connection.

**Why this priority**: Connections make the map a graph rather than a list. However, even without
connections, the individual waypoints and tours deliver standalone value, so this is lower priority.

**Independent Test**: With two waypoints present, create a connection between them. Verify an edge
appears in the graph. Remove the connection and verify the edge disappears.

**Acceptance Scenarios**:

1. **Given** two waypoints exist, **When** the user performs a connect action between them,
   **Then** a directed edge appears between the two nodes in the graph.
2. **Given** an edge exists, **When** the user selects and removes it, **Then** the edge disappears.
3. **Given** the graph is rendered with connections, **When** the user views it, **Then** edges are
   visually distinct from nodes and do not obscure node labels.

---

### User Story 5 - Create and Edit a Tour (Priority: P5)

A user creates a new tour by giving it a name and adding an ordered list of existing waypoints.
They can reorder, add, or remove waypoints from the tour. The tour is immediately available in the
tour selector.

**Why this priority**: The two sample tours satisfy immediate demo needs. Custom tour creation is
important for real use but is the most complex interaction and can follow after the core read and
create flows are proven.

**Independent Test**: Create a new tour named "Architecture Overview", add three waypoints to it in
order, reorder them, and verify the tour appears in the selector and navigates in the correct order.

**Acceptance Scenarios**:

1. **Given** the user triggers "Create Tour", **When** they provide a name and select waypoints,
   **Then** the new tour appears in the tour selector.
2. **Given** a tour is being edited, **When** the user reorders waypoints, **Then** the tour
   navigates in the new order when selected.
3. **Given** a tour exists, **When** the user removes a waypoint from it, **Then** that waypoint
   no longer appears in the tour sequence (but remains in the graph).

---

### Edge Cases

- What happens when the user creates a waypoint with no description? The waypoint MUST still be
  saveable; the description field is optional.
- What happens when the graph has no waypoints? An empty-state illustration or prompt to create
  the first waypoint MUST be shown.
- What happens when a tour has only one waypoint? Navigation controls MUST still render; Previous
  is disabled and Next shows "Finish".
- What happens when the user tries to connect a waypoint to itself? The action MUST be ignored or
  an inline error shown; self-loops are not permitted.
- What happens if state is lost on page refresh? The MVP uses local state only — data does not
  persist across refreshes. This is an accepted, documented limitation, not a bug.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST display a graph view of waypoints on the left side of the screen.
- **FR-002**: The app MUST display a waypoint detail panel on the right side of the screen.
- **FR-003**: The app MUST display a tour selector at the top of the screen.
- **FR-004**: The app MUST support eight waypoint types: User Need, Feature, ADR, Code Component,
  Test, Risk, AI Instruction, Open Question.
- **FR-005**: Each waypoint type MUST be visually distinguishable in the graph (distinct color or icon).
- **FR-006**: Users MUST be able to select a waypoint by clicking its node; the detail panel MUST
  update to show the selected waypoint's type, title, and description.
- **FR-007**: The tour selector MUST list all available tours; selecting one MUST begin tour navigation.
- **FR-008**: Tour navigation MUST provide Next and Previous controls; the current waypoint MUST be
  highlighted in the graph and shown in the detail panel.
- **FR-009**: The app MUST ship with two sample tours pre-loaded:
  - "New Developer Orientation"
  - "Why Waypoints and Tours Exist"
- **FR-010**: Users MUST be able to create a new waypoint with a title, type, and optional description.
- **FR-011**: Users MUST be able to edit an existing waypoint's title, type, and description.
- **FR-012**: Users MUST be able to draw a connection (directed edge) between two waypoints.
- **FR-013**: Users MUST be able to remove an existing connection between waypoints.
- **FR-014**: Users MUST be able to create a new tour with a name and an ordered list of waypoints.
- **FR-015**: Users MUST be able to reorder, add, and remove waypoints within a tour they are editing.
- **FR-016**: All state MUST be held in local (in-memory) application state; no server, database, or
  external storage is used in this version.
- **FR-017**: The app MUST ship with a pre-populated set of mock waypoints and the two sample tours to
  demonstrate the map concept without requiring the user to build from scratch.
- **FR-018**: The UI MUST be usable at a standard desktop viewport (1280px wide minimum) without
  horizontal scrolling.

### Key Entities

- **Waypoint**: A node in the understanding map. Has: unique ID, title, type (one of the eight
  supported types), description (optional), and position in the graph.
- **Connection**: A directed edge between two Waypoints. Has: source waypoint ID and target waypoint ID.
- **Tour**: An ordered sequence of Waypoints. Has: unique ID, name, and an ordered list of waypoint IDs.
- **AppState**: The top-level state container holding all Waypoints, Connections, and Tours.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can open the app and identify the purpose of at least three waypoints
  within two minutes using only the graph and detail panel, with no instructions.
- **SC-002**: A user can complete a full guided tour (start to finish) in under three minutes using
  only the tour selector and navigation controls.
- **SC-003**: A user can create a new waypoint, connect it to an existing one, and add it to a tour
  in under five minutes with no prior training.
- **SC-004**: All eight waypoint types are visually distinguishable at a glance — a user can correctly
  identify each type without reading labels in at least 80% of cases during informal testing.
- **SC-005**: The app loads and displays the sample data in under two seconds on a standard laptop.

## Assumptions

- The MVP targets desktop browsers only; mobile and tablet layouts are out of scope.
- All data is ephemeral — state resets on page refresh. Users are informed of this limitation in the UI.
- The two sample tours and their associated waypoints are hard-coded as mock data and do not need to
  be editable in the first release.
- No user accounts, login, or per-user state exist; the app is single-session.
- Authentication, GitHub integration, AI summarization, repository parsing, and database persistence
  are explicitly out of scope for this version.
- The graph layout algorithm (e.g., force-directed, hierarchical) is an implementation decision left
  to the planning phase; the spec only requires that waypoints are positioned and edges are rendered.
- "Directed edge" means the connection has a source and a target, but the MVP does not need to enforce
  or display edge directionality with arrowheads if doing so adds significant complexity — this is
  deferred to the planning phase.
