# Tasks: Waypoint Type Filter

**Input**: Design documents from `specs/005-waypoint-type-filter/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/waypoint-graph-props.md ✓, quickstart.md ✓

**Tests**: Not requested. Manual verification per `quickstart.md` serves as acceptance gate.

**Organization**: Tasks are grouped by user story. US1's implementation delivers all filtering capability — US2 and US3 share the same code paths and are incremental.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared type infrastructure that both `ShrimpApp` and `WaypointGraph` depend on. Must be complete before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Export `WAYPOINT_TYPES: WaypointType[]` constant and add `FilterState` type alias (`Record<WaypointType, boolean>`) to `app/lib/types.ts`

**Checkpoint**: `types.ts` exports `WAYPOINT_TYPES` and `FilterState` — downstream files can now import both.

---

## Phase 3: User Story 1 — Focus on a Single Waypoint Type (Priority: P1) 🎯 MVP

**Goal**: A user can open the filter panel, toggle one type off, and immediately see only the remaining types and their edges on the graph.

**Independent Test**: Open the app → click Filter → uncheck "ADR" → verify all ADR nodes vanish and their edges vanish → recheck "ADR" → verify all return in original positions.

### Implementation for User Story 1

- [x] T002 [P] [US1] Update `app/components/WaypointForm.tsx` — remove local `WAYPOINT_TYPES` constant; import `WAYPOINT_TYPES` from `app/lib/types.ts`
- [x] T003 [P] [US1] Update `app/components/ShrimpApp.tsx` — add `filterState: FilterState` state (default: all types `true` via `WAYPOINT_TYPES`), add `onFilterChange: (type: WaypointType, visible: boolean) => void` handler using `useCallback`, pass both as props to `<WaypointGraph>`
- [x] T004 [US1] Update `app/components/WaypointGraph.tsx` — extend `WaypointGraphProps` with `filterState: FilterState` and `onFilterChange: (type: WaypointType, visible: boolean) => void`; compute `hiddenNodeIds` (`Set<string>`) in a `useMemo`; update `nodes` memo to exclude waypoints whose type is hidden; update `rfEdges` memo to exclude edges whose `source` or `target` is in `hiddenNodeIds` (depends on T003)
- [x] T005 [US1] Update `app/components/WaypointGraph.tsx` — add `filterPanelOpen: boolean` local state; restructure the top-left toolbar `<div>` to a flex row containing the existing "+ Add Waypoint" button and a new "Filter" button; render filter panel as a dropdown (when open) listing `WAYPOINT_TYPES` with a checkbox and `WAYPOINT_COLORS` colour swatch per type; extend `onPaneClick` handler to also close the filter panel when open (depends on T004)

**Checkpoint**: US1 fully functional. Single-type filtering, node hiding, and edge hiding all work. Filter panel opens/closes correctly.

---

## Phase 4: User Story 2 — Hide Clutter to Surface High-Level Intent (Priority: P2)

**Goal**: Multiple types can be hidden simultaneously. All edges touching a hidden node disappear, with no dangling connections to visible nodes.

**Note**: US2 uses the same code path as US1 — the implementation from Phase 3 already handles multiple hidden types. This phase adds only the visual indicator that confirms the filter is active.

**Independent Test**: Hide "Code Component" and "AI Instruction" simultaneously → verify both type's nodes are gone → verify edges from visible nodes (e.g., ADR → Code Component) are also gone, with no dangling endpoints.

### Implementation for User Story 2

- [x] T006 [US2] Update `app/components/WaypointGraph.tsx` — add "active filter" indicator to the Filter button: compute `hiddenCount` (number of types with `filterState[type] === false`) and display it as a badge or label (e.g., `Filter (2 hidden)`) when `hiddenCount > 0`; button returns to plain `Filter` label when all types visible (depends on T005)

**Checkpoint**: US1 and US2 both functional. Multiple hidden types work correctly. Filter button signals active state.

---

## Phase 5: User Story 3 — Restore Full View (Priority: P3)

**Goal**: A user who has filtered the graph can easily return to the full view. Page refresh also resets filters.

**Note**: US3 requires no additional code. Individual type toggles (US1 implementation) restore each type. Page-refresh reset is guaranteed by the `useState` default (all-true). This phase is a verified no-op.

**Independent Test**: Filter several types → re-enable each individually → confirm graph matches pre-filter state. Refresh page → confirm all types visible.

**Checkpoint**: Confirm via browser that: (1) individual re-enable restores nodes to exact positions, (2) page refresh yields all-visible default. No new code required.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Manual acceptance gate and consistency check.

- [ ] T007 Run through all 11 items in the manual verification checklist in `specs/005-waypoint-type-filter/quickstart.md` in a running browser — confirm all pass before closing this feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately
- **User Story phases (3–5)**: All depend on Phase 2 (T001) completion
- **Polish (Phase 6)**: Depends on all user story phases complete

### User Story Dependencies

- **T002 and T003** [US1]: Both depend on T001; can run in parallel with each other (different files)
- **T004** [US1]: Depends on T003 (needs new `ShrimpApp` props defined before `WaypointGraph` types compile)
- **T005** [US1]: Depends on T004 (uses filtering logic + new props)
- **T006** [US2]: Depends on T005 (modifies the Filter button introduced in T005)
- **T007**: Depends on T006

### Parallel Opportunities

```bash
# After T001 completes, start T002 and T003 simultaneously:
Task T002: "Update WaypointForm.tsx — import WAYPOINT_TYPES from types.ts"
Task T003: "Update ShrimpApp.tsx — add filterState + onFilterChange + pass to WaypointGraph"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational — run T001
2. Run T002 + T003 in parallel
3. Run T004, then T005
4. **STOP and VALIDATE**: Open browser, manually test single-type filter toggle
5. If US1 passes: continue to Phase 4 (T006)

### Incremental Delivery

1. T001 → foundation ready
2. T002 + T003 (parallel) → T004 → T005 → **US1 complete** (full filter works)
3. T006 → **US2 visual complete** (active indicator)
4. Verify US3 (no code) → T007 → **feature done**

---

## Notes

- No new files are created — all changes are to existing files
- No API routes or database changes
- `WaypointForm.tsx` change (T002) is a pure refactor — behaviour unchanged, just removes a duplicate constant
- The `WAYPOINT_TYPES` constant order matters: new types added to `types.ts` automatically appear in both the form and the filter panel
- Commit after T001, after T005, and after T007 (or after each task if preferred)
