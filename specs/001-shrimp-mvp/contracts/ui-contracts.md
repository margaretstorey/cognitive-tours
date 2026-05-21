# UI Component Contracts: Shrimp 2.0 MVP

**Date**: 2026-05-21 | **Branch**: `001-shrimp-mvp`

These contracts define the props interface for each component. They are the authoritative source
for what each component accepts and emits — implementation must not add or remove props without
updating this document.

---

## ShrimpApp

**File**: `app/components/ShrimpApp.tsx`
**Type**: `'use client'` Client Component
**Role**: Root of the interactive tree. Owns all `AppState` via `useState`. Defines all mutation
handlers and passes them down as props.

**Props**: none (root component, rendered by `app/page.tsx`)

**State owned**:
```ts
waypoints: Waypoint[]
edges: WaypointEdge[]
tours: Tour[]
selectedWaypointId: string | null
activeTourId: string | null
activeTourStep: number
```

**Handlers defined here** (passed as props to children):
- `selectWaypoint(id: string | null): void`
- `createWaypoint(data: Omit<Waypoint, 'id' | 'position'>): void`
- `updateWaypoint(id: string, data: Partial<Omit<Waypoint, 'id'>>): void`
- `deleteWaypoint(id: string): void` — cascade: edges + tour refs
- `addEdge(connection: { source: string; target: string }): void`
- `deleteEdge(id: string): void`
- `createTour(data: Omit<Tour, 'id'>): void`
- `updateTour(id: string, data: Partial<Omit<Tour, 'id'>>): void`
- `selectTour(id: string | null): void`
- `setTourStep(step: number): void`

---

## TourBar

**File**: `app/components/TourBar.tsx`
**Type**: Client Component (receives props from ShrimpApp)
**Role**: Top bar containing the tour selector and, when a tour is active, step navigation controls.

**Props**:
```ts
interface TourBarProps {
  tours: Tour[]
  activeTourId: string | null
  activeTourStep: number
  activeTourLength: number           // derived: activeTour?.waypointIds.length ?? 0
  onSelectTour: (id: string | null) => void
  onNext: () => void
  onPrev: () => void
}
```

**Behavior**:
- Renders a `<select>` or styled dropdown listing all tours plus a "No tour" option
- When `activeTourId` is non-null, shows: `← Prev | Step N of M | Next →`
- Prev is disabled when `activeTourStep === 0`
- Next label changes to "Finish" when `activeTourStep === activeTourLength - 1`
- Finish/clicking "No tour" calls `onSelectTour(null)`

---

## WaypointGraph

**File**: `app/components/WaypointGraph.tsx`
**Type**: `'use client'` Client Component
**Role**: React Flow canvas occupying the left panel. Renders nodes and edges; handles drag-to-connect
and node position updates. Does not own state — syncs from props.

**Props**:
```ts
interface WaypointGraphProps {
  waypoints: Waypoint[]
  edges: WaypointEdge[]
  selectedWaypointId: string | null
  onSelectWaypoint: (id: string | null) => void
  onConnect: (connection: { source: string; target: string }) => void
  onDeleteEdge: (id: string) => void
  onDeleteWaypoint: (id: string) => void
  onNodePositionChange: (id: string, position: { x: number; y: number }) => void
  onAddWaypointClick: () => void  // triggers WaypointForm in create mode
}
```

**React Flow mapping**:
- Each `Waypoint` → `Node` with `id`, `position`, `data: { waypoint }`, `type: 'waypointNode'`
- Selected waypoint → `selected: true` on the matching node
- Each `WaypointEdge` → `Edge` with `id`, `source`, `target`
- `onConnect` fires React Flow's `Connection` → calls `props.onConnect` after filtering self-loops
- `onNodesChange` handles position drags; calls `onNodePositionChange` for position changes

---

## WaypointDetail

**File**: `app/components/WaypointDetail.tsx`
**Type**: Client Component
**Role**: Right panel. Shows the selected waypoint's details; provides Edit and Delete actions.
When no waypoint is selected, shows an empty/instruction state.

**Props**:
```ts
interface WaypointDetailProps {
  waypoint: Waypoint | null          // null when nothing selected
  onEdit: (waypoint: Waypoint) => void    // opens WaypointForm in edit mode
  onDelete: (id: string) => void
}
```

**Behavior**:
- When `waypoint` is null: render a neutral placeholder ("Select a waypoint to see details")
- When `waypoint` is set: render type badge, title, description, optional notes
- Edit button calls `onEdit(waypoint)` — parent renders WaypointForm pre-populated
- Delete button calls `onDelete(waypoint.id)` — parent handles cascade

---

## WaypointForm

**File**: `app/components/WaypointForm.tsx`
**Type**: Client Component
**Role**: Create or edit a waypoint. Rendered as a modal overlay or side panel when active.

**Props**:
```ts
interface WaypointFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<Omit<Waypoint, 'id' | 'position'>>  // provided in edit mode
  onSave: (data: Omit<Waypoint, 'id' | 'position'>) => void
  onCancel: () => void
}
```

**Behavior**:
- Fields: `label` (text input, required), `type` (select, required), `description` (textarea),
  `notes` (textarea, optional)
- Save is disabled until `label` is non-empty and `type` is selected
- Cancel calls `onCancel` with no changes
- On save, calls `onSave` with the form values; parent assigns `id` and `position`
- In create mode, `initialValues` is undefined; all fields start empty
- In edit mode, `initialValues` pre-fills all fields

---

## Layout Contract

The outer layout is defined in `ShrimpApp` using Tailwind:

```
┌──────────────────────────────────────────────────┐
│  TourBar (h-12, full width, top)                 │
├─────────────────────────────┬────────────────────┤
│  WaypointGraph              │  WaypointDetail    │
│  (flex-1, left)             │  (w-80, right)     │
│                             │                    │
│                             │                    │
└─────────────────────────────┴────────────────────┘
```

- Overall: `flex flex-col h-screen`
- Content row: `flex flex-1 overflow-hidden`
- Graph panel: `flex-1 relative` (React Flow needs a positioned, sized parent)
- Detail panel: `w-80 border-l overflow-y-auto`
- WaypointForm: absolute overlay or right-side modal (implementation choice)
