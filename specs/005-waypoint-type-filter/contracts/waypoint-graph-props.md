# Contract: WaypointGraph Props

**Component**: `app/components/WaypointGraph.tsx`
**Changed by**: feature 005-waypoint-type-filter

This document records the prop interface changes to `WaypointGraph`. All existing props are unchanged. Two new props are added.

---

## Updated `WaypointGraphProps` interface

### Existing props (unchanged)

| Prop | Type | Description |
|------|------|-------------|
| `waypoints` | `Waypoint[]` | All waypoints (unfiltered — WaypointGraph applies filtering internally) |
| `edges` | `WaypointEdge[]` | All edges (unfiltered) |
| `selectedWaypointId` | `string \| null` | Currently selected waypoint |
| `activeTourWaypointIds` | `string[]` | Waypoints in the active tour (for focus-mode dimming) |
| `onSelectWaypoint` | `(id: string \| null) => void` | Called when a node is clicked |
| `onConnect` | `(connection: { source: string; target: string; label?: string }) => void` | Called when an edge is dragged |
| `onDeleteEdge` | `(id: string) => void` | Called when an edge is deleted |
| `onDeleteWaypoint` | `(id: string) => void` | Called when a waypoint is deleted |
| `onNodePositionChange` | `(id: string, position: { x: number; y: number }) => void` | Called on drag |
| `onAddWaypointClick` | `() => void` | Called when the "+ Add Waypoint" button is clicked |

### New props

| Prop | Type | Description |
|------|------|-------------|
| `filterState` | `FilterState` | Current visibility of each waypoint type (`Record<WaypointType, boolean>`) |
| `onFilterChange` | `(type: WaypointType, visible: boolean) => void` | Called when the user toggles a type in the filter panel |

---

## Caller contract (ShrimpApp)

`ShrimpApp` MUST:
- Initialise `filterState` to all-true on mount (using `WAYPOINT_TYPES` from `types.ts`)
- Pass the full unfiltered `waypoints` and `edges` arrays — `WaypointGraph` is responsible for applying the filter
- Handle `onFilterChange` by updating the relevant key in `filterState` immutably

`ShrimpApp` MUST NOT:
- Pre-filter the waypoints or edges arrays before passing them in
- Store the filter panel open/closed state (that is internal to `WaypointGraph`)

---

## Filtering behaviour contract (WaypointGraph)

`WaypointGraph` MUST:
- Exclude waypoints whose type has `filterState[type] === false` from the React Flow nodes array
- Exclude edges whose `source` or `target` is a hidden waypoint from the React Flow edges array
- Display a Filter button in the top-left toolbar, next to the "+ Add Waypoint" button
- Show the filter panel (toggles for each type) when the Filter button is active
- Close the filter panel when the graph pane is clicked
- Show the type's colour swatch next to each toggle label (use `WAYPOINT_COLORS`)

`WaypointGraph` MUST NOT:
- Modify the `waypoints` or `edges` props
- Call `onFilterChange` with types not in `WaypointType`
- Persist filter state
