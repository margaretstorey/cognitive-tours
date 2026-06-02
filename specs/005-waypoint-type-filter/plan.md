# Implementation Plan: Waypoint Type Filter

**Branch**: `005-waypoint-type-filter` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-waypoint-type-filter/spec.md`

## Summary

Add a Filter button to the graph canvas (top-left, next to "+ Add Waypoint") that expands to show one toggle per waypoint type. Toggling a type off immediately hides all nodes of that type and all edges touching those nodes. Filter state lives in `ShrimpApp` and is passed to `WaypointGraph` as props. No API routes, no database writes — purely UI state that resets on page refresh.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enforced)

**Primary Dependencies**: Next.js 16 App Router, @xyflow/react 12, Tailwind CSS, React 19

**Storage**: N/A — filter state is session-only, held in React state

**Testing**: Manual browser verification; Playwright tests planned for future (not in scope here)

**Target Platform**: Web browser (Chrome/Safari desktop, local dev server)

**Project Type**: Web application — single-file `use client` root component pattern

**Performance Goals**: Filter toggle updates the graph in <16ms (next animation frame); no perceptible lag

**Constraints**:
- No new API routes
- No changes to database schema or existing API contracts
- No changes to the three-panel layout
- Filter state resets on page refresh (not persisted)
- All 9 waypoint types (Goal, User Need, Feature, ADR, Code Component, Test, Risk, AI Instruction, Open Question) must appear in the filter panel

**Scale/Scope**: ~30 waypoints, 9 types, single user, local dev

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

- [x] **I. Simplicity**: Filter state is a `Record<WaypointType, boolean>` — the simplest possible representation. No new abstraction layer, no new component beyond what the feature requires. Filtering is computed in existing memos inside `WaypointGraph`, not a new service.
- [x] **II. Incremental Growth**: Feature is one self-contained slice: add state → add UI → apply filter in memos. Can be merged as a single PR that leaves the app fully runnable with or without filter active.
- [x] **III. Intent Before Implementation**: Spec is complete with user stories, acceptance scenarios, and 11 functional requirements before any code is written.
- [x] **IV. Clean TypeScript**: `FilterState` is a typed alias over `Record<WaypointType, boolean>`. No `any`. `WAYPOINT_TYPES` exported as a typed constant. The filter toggle handler is typed `(type: WaypointType, visible: boolean) => void`.
- [x] **V. Minimal UI**: Filter panel shows only what the user needs: a type name, a colour swatch, and a toggle. No icons, badges, or decoration beyond functional colour coding already established in the app.
- [x] **VI. Universal Waypoints & Tours**: Filter operates on the existing type system — it does not constrain or privilege any type. A project with no Code Components is unaffected; a project with only intent waypoints works identically.
- [x] **VII. Flexible Navigation**: Filter works equally for code-linked waypoints and intent-only waypoints. It does not inspect `filePath` or any mode-specific attribute — it operates on `type` only.
- [x] **VIII. Human and Agent Readable**: No waypoint content is changed. Filter is a display concern only; the data model, labels, and descriptions are untouched.

All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/005-waypoint-type-filter/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── waypoint-graph-props.md   ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (files touched by this feature)

```text
app/
  lib/
    types.ts                  ← Add FilterState type; export WAYPOINT_TYPES constant
  components/
    ShrimpApp.tsx             ← Add filterState state; pass filterState + onFilterChange to WaypointGraph
    WaypointGraph.tsx         ← Add filter panel UI; filter nodes/rfEdges memos
    WaypointForm.tsx          ← Import WAYPOINT_TYPES from types.ts (remove local duplicate)
```

**Structure Decision**: Single Next.js app, `use client` root. No new files beyond planning artifacts. All changes are additions or small modifications to the three files above.
