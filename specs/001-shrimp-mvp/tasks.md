---
description: "Task list for Shrimp 2.0 MVP — Understanding Map"
---

# Tasks: Shrimp 2.0 MVP — Understanding Map

**Input**: Design documents from `/specs/001-shrimp-mvp/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | contracts/ui-contracts.md ✅ | research.md ✅

**Tests**: Not requested in spec — no test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Each task includes the exact file path to create or modify

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish types, constants, and mock data before any component work begins.

- [ ] T001 Verify `app/lib/types.ts` matches the data model spec — ensure `Waypoint`, `WaypointEdge`, `Tour` types are complete and add `AppState` interface; update `label` field if renamed from `title`
- [ ] T002 Add `@import '@xyflow/react/dist/style.css'` in `app/globals.css` after the Tailwind import so React Flow renders correctly
- [ ] T003 [P] Create `app/lib/waypoint-colors.ts` — export a `WAYPOINT_COLORS` record mapping each of the 8 `WaypointType` values to a Tailwind bg class (e.g. `'User Need': 'bg-blue-100'`); see research.md color table
- [ ] T004 [P] Create `app/lib/mock-data.ts` — export `INITIAL_WAYPOINTS` (12 waypoints about Shrimp itself), `INITIAL_EDGES` (8 edges), and `INITIAL_TOURS` (2 tours with 6 steps each) as defined in data-model.md

---

## Phase 2: Foundational (Root State + Layout Shell)

**Purpose**: Create `ShrimpApp` with all state and handlers, and wire it into the page. All story phases build on this.

- [ ] T005 Create `app/components/ShrimpApp.tsx` as a `'use client'` component — initialise `AppState` from mock-data.ts using `useState`; define all mutation handlers (`selectWaypoint`, `createWaypoint`, `updateWaypoint`, `deleteWaypoint`, `addEdge`, `deleteEdge`, `createTour`, `updateTour`, `selectTour`, `setTourStep`) per contracts/ui-contracts.md; implement `deleteWaypoint` cascade (filter edges by source/target, filter tour waypointIds); render a three-panel shell (`flex flex-col h-screen`: TourBar top, graph left `flex-1`, detail right `w-80`)
- [ ] T006 Update `app/page.tsx` to import and render `<ShrimpApp />` with no other logic

---

## Phase 3: User Story 1 — Explore the Understanding Map

**Story goal**: A user can open the app, see a graph of typed waypoints, click a node, and read its details in the right panel.

**Independent test**: Load app with mock data → graph renders all 12 nodes with distinct type colors → clicking a node populates the detail panel → clicking another node updates the panel.

- [ ] T007 [US1] Create a custom React Flow node type `WaypointNode` inside `app/components/WaypointGraph.tsx` — renders a card with the waypoint's type-colored background (from `waypoint-colors.ts`) and its `label`; exports a `nodeTypes` record `{ waypointNode: WaypointNode }`
- [ ] T008 [P] [US1] Create `app/components/WaypointGraph.tsx` — `'use client'` component accepting `WaypointGraphProps` (per ui-contracts.md); map `waypoints` to React Flow `nodes` (using `waypointNode` type, `selected` flag for `selectedWaypointId`) and `edges` to React Flow `edges`; wire `onNodeClick` to `onSelectWaypoint`; wire `onNodesChange` to propagate position changes via `onNodePositionChange`; include `<Background />` and `<Controls />`; wrap in `ReactFlowProvider`
- [ ] T009 [P] [US1] Create `app/components/WaypointDetail.tsx` — accepts `WaypointDetailProps` (per ui-contracts.md); renders empty state message when `waypoint` is null; when set, renders: type badge (colored with `waypoint-colors.ts`), `label` as heading, `description` paragraph, optional `notes` section; placeholder Edit and Delete buttons (handlers wired in T016/T021)
- [ ] T010 [US1] Wire `WaypointGraph` and `WaypointDetail` into `ShrimpApp.tsx` — pass all required props; verify layout: graph fills left, detail fills right, app is usable at 1280px without horizontal scroll

---

## Phase 4: User Story 2 — Follow a Guided Tour

**Story goal**: A user selects a tour from the top bar, steps through its waypoints with Next/Prev controls, and the graph highlights the current waypoint.

**Independent test**: Select "New Developer Orientation" → step through all 6 waypoints → each step highlights the correct graph node and shows correct detail → last step shows "Finish" → clicking Finish deselects the tour.

- [ ] T011 [US2] Create `app/components/TourBar.tsx` — accepts `TourBarProps` (per ui-contracts.md); renders a `<select>` dropdown listing all tours plus a "No tour" option; when `activeTourId` is non-null renders step navigation: `← Prev` (disabled at step 0), `Step N of M`, `Next →` (reads "Finish" at last step); Prev calls `onPrev`, Next/Finish calls `onNext` or `onSelectTour(null)`
- [ ] T012 [US2] Add `activeTourId` / `activeTourStep` state and tour navigation handlers to `ShrimpApp.tsx` — `selectTour` sets `activeTourId` and resets step to 0 and sets `selectedWaypointId` to the first waypoint; `setTourStep` updates step and syncs `selectedWaypointId`; `onNext` / `onPrev` advance/retreat step (clamped to tour length)
- [ ] T013 [US2] Wire `TourBar` into `ShrimpApp.tsx` — pass `tours`, `activeTourId`, `activeTourStep`, derived `activeTourLength`, `onSelectTour`, `onNext`, `onPrev`; verify that advancing tour steps highlights the correct node in the graph (via `selectedWaypointId` sync)

---

## Phase 5: User Story 3 — Create and Edit a Waypoint

**Story goal**: A user creates a new waypoint via a form, edits an existing one, and deletes one — with cascade removing associated edges and tour memberships.

**Independent test**: Click "Add Waypoint" → fill title + type → save → node appears in graph → select node → click Edit → change description → save → detail panel reflects change → click Delete → node removed from graph, its edges removed, its tour memberships removed.

- [ ] T014 [US3] Create `app/components/WaypointForm.tsx` — accepts `WaypointFormProps` (per ui-contracts.md); renders controlled form with `label` (text input, required), `type` (select, all 8 options), `description` (textarea), `notes` (textarea, optional); Save disabled until `label` non-empty and `type` selected; Cancel calls `onCancel`; Save calls `onSave` with form values; pre-fills all fields from `initialValues` in edit mode; render as a modal overlay (fixed overlay with centered card)
- [ ] T015 [US3] Add "Add Waypoint" button to `WaypointGraph.tsx` (absolute-positioned in the canvas corner, calls `onAddWaypointClick`) — wire in `ShrimpApp.tsx`: show `WaypointForm` in create mode; on save call `createWaypoint` (assign a generated `id` and a default `position`); on cancel hide form
- [ ] T016 [US3] Wire Edit button in `WaypointDetail.tsx` — on click calls `onEdit(waypoint)`; in `ShrimpApp.tsx` open `WaypointForm` in edit mode with `initialValues` from the selected waypoint; on save call `updateWaypoint`; on cancel hide form
- [ ] T017 [US3] Wire Delete button in `WaypointDetail.tsx` — calls `onDelete(waypoint.id)`; in `ShrimpApp.tsx` the `deleteWaypoint` handler runs cascade (remove edges, remove from tours, clear selection if deleted waypoint was selected)

---

## Phase 6: User Story 4 — Connect Waypoints

**Story goal**: A user drags from a node handle to another node to create an edge; selects and deletes an edge to remove it.

**Independent test**: Hover a node → handle appears → drag to another node → edge appears → select edge → press Delete (or use edge context) → edge disappears; self-loop attempt is ignored.

- [ ] T018 [US4] Add `<Handle position={Position.Right} type="source" />` and `<Handle position={Position.Left} type="target" />` to `WaypointNode` in `WaypointGraph.tsx` — handles are visible on hover; wire `onConnect` in `ReactFlow` to call `props.onConnect` after filtering self-loops (`connection.source !== connection.target`)
- [ ] T019 [US4] Wire `onEdgesDelete` in `WaypointGraph.tsx` to call `props.onDeleteEdge` for each deleted edge ID; confirm edges are deletable via keyboard Delete key or click-to-select then Delete (React Flow default behaviour)

---

## Phase 7: User Story 5 — Create and Edit a Tour

**Story goal**: A user creates a new tour by naming it and selecting an ordered list of waypoints; can reorder, add, and remove waypoints from it.

**Independent test**: Click "Create Tour" → name "Architecture Overview" → add 3 waypoints → reorder them → save → tour appears in selector → select it → navigates in the new order.

- [ ] T020 [US5] Add a "Create Tour" button to `TourBar.tsx` — opens an inline or modal tour editor with: name input, waypoint picker (list of existing waypoints to add in order), reorder controls (up/down or drag), remove-from-tour button per step; Save calls `onCreateTour` or `onUpdateTour`; wire `createTour` and `updateTour` handlers in `ShrimpApp.tsx`
- [ ] T021 [US5] Add an "Edit Tour" action to `TourBar.tsx` for the currently selected tour — opens the same tour editor pre-filled; on save calls `updateTour` in `ShrimpApp.tsx`

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Empty states, user-visible limitations notice, and final layout polish.

- [ ] T022 [P] Add empty-state UI in `WaypointGraph.tsx` — when `waypoints` array is empty, render a centred prompt ("No waypoints yet — click Add Waypoint to start") instead of the React Flow canvas
- [ ] T023 [P] Add an ephemeral-state notice visible on the page (e.g. a subtle banner in `TourBar.tsx` or footer in `ShrimpApp.tsx`): "Data resets on page refresh — no persistence in this version"
- [ ] T024 Manual acceptance-test walkthrough against spec.md success criteria SC-001 through SC-005 — verify in a running browser; confirm 1280px viewport, load time under 2s, tour completion under 3min, type distinguishability

---

## Dependencies

```
Phase 1 (T001–T004)
  └── Phase 2 (T005–T006)
        ├── Phase 3 US1 (T007–T010)   ← enables browse/select
        │     ├── Phase 4 US2 (T011–T013)  ← requires graph + selection
        │     ├── Phase 5 US3 (T014–T017)  ← requires graph + detail panel
        │     └── Phase 6 US4 (T018–T019)  ← requires graph + node handles
        └── Phase 7 US5 (T020–T021)   ← requires TourBar from Phase 4
Phase 8 (T022–T024)  ← after all phases
```

Within Phase 3:
- T007 (WaypointNode) → T008 (WaypointGraph) → T010 (wire into ShrimpApp)
- T009 (WaypointDetail) can run in parallel with T008

Within Phase 5:
- T014 (WaypointForm) → T015 (create) → T016 (edit) → T017 (delete)

## Parallel Execution Opportunities

**Phase 1**: T003 and T004 run in parallel (different files, no dependencies between them)

**Phase 3**: T008 and T009 run in parallel (WaypointGraph and WaypointDetail are independent components)

**Phase 8**: T022 and T023 run in parallel (different files)

## Implementation Strategy

**MVP delivery order** (matches user story priorities):

1. **Phase 1 + 2 + 3** → Working read-only map (SC-001, SC-005 testable)
2. **+ Phase 4** → Guided tour navigation (SC-002 testable)
3. **+ Phase 5** → Waypoint creation and editing (SC-003 testable)
4. **+ Phase 6** → Connect waypoints
5. **+ Phase 7** → Create and edit tours
6. **+ Phase 8** → Polish and sign-off (all SC criteria verifiable)

Each phase boundary leaves the app in a fully runnable, demonstrable state.
