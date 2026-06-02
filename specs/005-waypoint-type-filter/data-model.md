# Data Model: Waypoint Type Filter

**Feature**: 005-waypoint-type-filter | **Date**: 2026-06-01

This feature introduces one new type alias and one new exported constant. No database schema changes. No new API contracts.

---

## New: `FilterState`

**Location**: `app/lib/types.ts`

**Definition**:
```
FilterState = Record<WaypointType, boolean>
```

A flat map from each waypoint type to its current visibility. `true` means the type is visible; `false` means all nodes of that type and their connected edges are hidden from the graph.

**Fields**: one boolean per member of the `WaypointType` union (currently 9 entries):
- `'Goal'` → boolean
- `'User Need'` → boolean
- `'Feature'` → boolean
- `'ADR'` → boolean
- `'Code Component'` → boolean
- `'Test'` → boolean
- `'Risk'` → boolean
- `'AI Instruction'` → boolean
- `'Open Question'` → boolean

**Default value**: all `true` (all types visible). Computed once on app load:
```
Object.fromEntries(WAYPOINT_TYPES.map(t => [t, true])) as FilterState
```

**Validation rules**:
- Every key in `WaypointType` MUST be present — no partial records.
- Values are boolean only.

**State transitions**:
- Initialised to all-true at app startup.
- Updated by a single toggle action: `(type: WaypointType, visible: boolean) → new FilterState`.
- Reset to all-true on page refresh (not persisted).

---

## New: `WAYPOINT_TYPES` constant

**Location**: `app/lib/types.ts`

**Definition**: `readonly WaypointType[]` — the canonical ordered list of all waypoint types.

**Order**: Goal, User Need, Feature, ADR, Code Component, Test, Risk, AI Instruction, Open Question.

**Purpose**: Single source of truth for any component that needs to iterate over types (filter panel, create/edit form). Replaces the local duplicate in `WaypointForm.tsx`.

---

## Derived computations (not stored)

These are computed inline from `filterState` each render — they are not stored anywhere.

**`hiddenNodeIds`**: `Set<string>` — IDs of waypoints whose type is currently hidden.
```
new Set(waypoints.filter(w => !filterState[w.type]).map(w => w.id))
```

**`visibleNodes`**: the subset of waypoints passed to React Flow — excludes hidden types.

**`visibleEdges`**: the subset of edges passed to React Flow — excludes any edge whose source or target is in `hiddenNodeIds`.
