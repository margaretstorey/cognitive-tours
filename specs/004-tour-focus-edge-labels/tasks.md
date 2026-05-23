# Tasks: Tour Focus Mode and Edge Labels

**Input**: Design documents from `/specs/004-tour-focus-edge-labels/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contracts.md

**Tests**: Not explicitly requested — no test tasks generated.

**Organization**: Two user stories (US1, US2). Both are changes to `WaypointGraph.tsx` and
`ShrimpApp.tsx`. Foundational tasks update shared prop interfaces; US1 and US2 are then
implemented sequentially in the same files.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[US1]**: Tour Focus Mode (Priority: P1)
- **[US2]**: Edge Labels (Priority: P2)

---

## Phase 1: Foundational (Shared Prop Interface Changes)

**Purpose**: Update shared prop interfaces in both components so US1 and US2 can be added
cleanly. These are non-breaking additive changes that must precede story implementation.

- [ ] T001 In `app/components/WaypointGraph.tsx`: add `activeTourWaypointIds: string[]` to the `WaypointGraphProps` interface and destructure it in the `Graph` function signature
- [ ] T002 In `app/components/WaypointGraph.tsx`: update the `onConnect` prop type in `WaypointGraphProps` from `(connection: { source: string; target: string }) => void` to `(connection: { source: string; target: string; label?: string }) => void`
- [ ] T003 [P] In `app/components/ShrimpApp.tsx`: update the `addEdge` handler parameter from `{ source: string; target: string }` to `{ source: string; target: string; label?: string }` and spread `label` into the `WaypointEdge` object alongside `id`, `source`, and `target`

**Checkpoint**: `tsc --noEmit` passes. Foundation ready for story implementation.

---

## Phase 2: User Story 1 — Tour Focus Mode (Priority: P1) 🎯 MVP

**Goal**: When a tour is active, non-tour waypoints and fully-non-tour edges dim to ~20%
opacity in the graph. Full opacity is restored when no tour is selected.

**Independent Test**: Create 5 waypoints and a tour containing 2 of them. Select the tour.
Verify the 3 non-tour waypoints are visually faint and the 2 tour waypoints are at full
brightness. Deselect the tour and verify all 5 return to full opacity.

- [ ] T004 [US1] In `app/components/ShrimpApp.tsx`: derive `const activeTourWaypointIds = activeTour?.waypointIds ?? []` and pass it to `<WaypointGraph activeTourWaypointIds={activeTourWaypointIds} />`
- [ ] T005 [US1] In `app/components/WaypointGraph.tsx` `Graph` component: update the `nodes` `useMemo` to add `style: activeTourWaypointIds.length > 0 && !activeTourWaypointIds.includes(w.id) ? { opacity: 0.2 } : undefined` on each node; add `activeTourWaypointIds` to the `useMemo` dependency array
- [ ] T006 [US1] In `app/components/WaypointGraph.tsx` `Graph` component: update the `rfEdges` `useMemo` to add `style: activeTourWaypointIds.length > 0 && !activeTourWaypointIds.includes(e.source) && !activeTourWaypointIds.includes(e.target) ? { opacity: 0.2 } : undefined` on each edge; add `activeTourWaypointIds` to the `useMemo` dependency array

**Checkpoint**: Tour focus verified — selecting a tour dims non-tour elements; deselecting restores all.

---

## Phase 3: User Story 2 — Edge Labels (Priority: P2)

**Goal**: Existing edge labels are visible on the graph. When dragging to create a new
connection, a small prompt allows the user to optionally label the edge before it is created.

**Independent Test**: (a) Open the app — verify any edge with an existing label shows its
label text. (b) Drag to connect two waypoints, type "depends on" in the prompt, confirm —
verify the edge appears with "depends on" visible. (c) Drag-connect again, click Cancel —
verify no edge is created.

- [ ] T007 [US2] In `app/components/WaypointGraph.tsx` `Graph` component: update the `rfEdges` `useMemo` to include `label: e.label` on each React Flow edge object (React Flow renders the label natively when the prop is present)
- [ ] T008 [US2] In `app/components/WaypointGraph.tsx` `Graph` component: add `const [pendingConnection, setPendingConnection] = useState<{ source: string; target: string } | null>(null)` and `const [pendingLabel, setPendingLabel] = useState('')`; change `handleConnect` so it calls `setPendingConnection({ source: connection.source, target: connection.target })` and `setPendingLabel('')` instead of calling `onConnect` directly
- [ ] T009 [US2] In `app/components/WaypointGraph.tsx` `Graph` component: implement `confirmConnect` (calls `onConnect({ ...pendingConnection!, label: pendingLabel.trim() || undefined })` then `setPendingConnection(null)`) and `cancelConnect` (calls `setPendingConnection(null)` only); render a label prompt overlay when `pendingConnection !== null` — an absolute centered overlay containing a text input (autoFocus, onKeyDown Enter=confirm Escape=cancel), an "Add Connection" button, and a "Cancel" button

**Checkpoint**: US2 fully functional — all five acceptance scenarios from spec.md pass.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [ ] T010 Manually verify all acceptance scenarios: (1) active tour → non-tour nodes at ~20% opacity; (2) deselect tour → all nodes full opacity; (3) drag-connect → label prompt appears; (4) type label → confirm → edge with label visible on graph; (5) drag-connect → cancel → no edge created; (6) empty label confirm → unlabelled edge created

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (T001–T003)**: T001 and T002 are sequential (same interface block in WaypointGraph.tsx); T003 is independent (ShrimpApp.tsx) — marked [P]
- **US1 (T004–T006)**: T004 depends on T001 (prop must exist before it can be passed); T005 and T006 depend on T001 (activeTourWaypointIds must be in props)
- **US2 (T007–T009)**: T007 is additive to `rfEdges` — can be done before or after T005/T006 but after T006 to avoid two rfEdges edits; T008 depends on T002 (onConnect type must be updated); T009 depends on T008 (state must exist)
- **Polish (T010)**: Depends on all story tasks complete

### Parallel Opportunities

```
Phase 1:
  T003 [P] — ShrimpApp.tsx (addEdge label) — parallel with T001+T002 in WaypointGraph.tsx

Phase 2 (after T001 complete):
  T004, T005, T006 — all sequential (WaypointGraph.tsx and ShrimpApp.tsx changes depend on T001)

Phase 3 (after T002 and T006 complete):
  T007, T008, T009 — sequential (same file, each depends on prior)
```

---

## Implementation Strategy

### MVP First (US1 only — 6 tasks)

1. Complete T001, T002, T003 (Foundational)
2. Complete T004, T005, T006 (US1 — Tour Focus Mode)
3. Run `tsc --noEmit`, test in browser
4. **STOP and validate**: select a tour, confirm dimming works
5. Proceed to US2 (T007–T009)

### Incremental Validation

- After T004: TypeScript should pass (prop now flows from ShrimpApp)
- After T005: node opacity changes visible in browser when tour is active
- After T006: edge opacity changes also apply
- After T007: existing labelled edges show their labels in the graph immediately
- After T008: dragging to connect no longer creates an edge immediately — prompt appears
- After T009: label prompt is fully functional (confirm creates edge, cancel discards)

---

## Notes

- [P] only on T003 — all other tasks affect WaypointGraph.tsx which is a single file edited sequentially
- T007 and T006 both modify the `rfEdges` useMemo — do T006 first, then T007 adds `label: e.label` to the same map; do not attempt to do them in parallel
- The `Graph` component inside WaypointGraph.tsx already uses `useState` for nothing — adding it in T008 is a clean addition with no side effects on existing behaviour
- React Flow renders edge labels natively when `label` is set on the edge object — no custom edge component or EdgeLabelRenderer needed
