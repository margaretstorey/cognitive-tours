# Data Model: Shrimp 2.0 MVP

**Date**: 2026-05-21 | **Branch**: `001-shrimp-mvp`

## Entities

### WaypointType (union)

```ts
type WaypointType =
  | 'User Need'
  | 'Feature'
  | 'ADR'
  | 'Code Component'
  | 'Test'
  | 'Risk'
  | 'AI Instruction'
  | 'Open Question'
```

### Waypoint

A node in the understanding map.

```ts
interface Waypoint {
  id: string                          // UUID, client-generated on create
  label: string                       // Display title (required, non-empty)
  type: WaypointType                  // One of the eight types
  description: string                 // Rich text description (may be empty string)
  notes?: string                      // Optional supplementary notes
  position: { x: number; y: number }  // Graph canvas position (session-only)
}
```

**Constraints**:
- `id` is unique across all waypoints in the session
- `label` MUST NOT be empty
- `type` MUST be one of the eight enumerated values
- `position` is mutable during the session (user can drag nodes); not persisted across refresh

### WaypointEdge (Connection)

A directed edge between two waypoints.

```ts
interface WaypointEdge {
  id: string     // UUID, client-generated on create
  source: string // Waypoint id of the source (tail of arrow)
  target: string // Waypoint id of the target (head of arrow)
  label?: string // Optional relationship label (not required for MVP)
}
```

**Constraints**:
- `source !== target` (self-loops are not permitted — enforced in `onConnect` handler)
- At most one edge between any given (source, target) pair in the same direction (duplicate
  prevention is a nice-to-have; enforced if simple, otherwise deferred)
- When the referenced source or target waypoint is deleted, this edge MUST be removed (cascade)

### Tour

An ordered sequence of waypoints that guides understanding.

```ts
interface Tour {
  id: string            // UUID
  name: string          // Display name (required, non-empty)
  description: string   // One-line summary of the tour's purpose
  waypointIds: string[] // Ordered list of waypoint IDs; may become empty via cascade delete
}
```

**Constraints**:
- A waypoint may appear in the same tour more than once (rare but not forbidden)
- `waypointIds` references valid waypoint IDs; on deletion, the reference is removed (cascade)
- A tour with zero steps remains in the selector (it is not deleted automatically)

### AppState

Top-level state container held in `ShrimpApp` via `useState`.

```ts
interface AppState {
  waypoints: Waypoint[]
  edges: WaypointEdge[]
  tours: Tour[]
  selectedWaypointId: string | null  // Graph selection
  activeTourId: string | null        // Currently running tour
  activeTourStep: number             // 0-based index into active tour's waypointIds
}
```

**Derived values** (computed, not stored):
- `activeTour`: `tours.find(t => t.id === activeTourId)`
- `activeTourWaypoint`: `waypoints.find(w => w.id === activeTour?.waypointIds[activeTourStep])`
- `selectedWaypoint`: `waypoints.find(w => w.id === selectedWaypointId)`

## Mock Data — Shrimp About Itself

### Waypoints (12)

| id  | label                                    | type            |
|-----|------------------------------------------|-----------------|
| w01 | Developers need mental models, not code  | User Need       |
| w02 | Waypoints                                | Feature         |
| w03 | Tours                                    | Feature         |
| w04 | Local state only for MVP                 | ADR             |
| w05 | React Flow for graph visualization       | ADR             |
| w06 | ShrimpApp — root state component         | Code Component  |
| w07 | WaypointGraph — React Flow canvas        | Code Component  |
| w08 | WaypointDetail — right panel             | Code Component  |
| w09 | Tour navigation acceptance test          | Test            |
| w10 | Graph becomes too dense to navigate      | Risk            |
| w11 | Read the spec before writing components  | AI Instruction  |
| w12 | How should waypoints be exported/shared? | Open Question   |

### Sample Edges (connections in mock data)

| source | target | meaning                          |
|--------|--------|----------------------------------|
| w01    | w02    | User need motivates Waypoints    |
| w01    | w03    | User need motivates Tours        |
| w02    | w03    | Waypoints enable Tours           |
| w05    | w07    | React Flow ADR drives component  |
| w06    | w07    | ShrimpApp contains Graph canvas  |
| w06    | w08    | ShrimpApp contains Detail panel  |
| w03    | w09    | Tour feature has acceptance test |
| w10    | w04    | Risk mitigated by scope decision |

### Tour 1 — "New Developer Orientation"

Steps: w01 → w02 → w03 → w06 → w04 → w12

| Step | Waypoint                                  |
|------|-------------------------------------------|
| 1    | Developers need mental models, not code   |
| 2    | Waypoints                                 |
| 3    | Tours                                     |
| 4    | ShrimpApp — root state component          |
| 5    | Local state only for MVP                  |
| 6    | How should waypoints be exported/shared?  |

### Tour 2 — "Why Waypoints and Tours Exist"

Steps: w01 → w10 → w05 → w02 → w03 → w11

| Step | Waypoint                                  |
|------|-------------------------------------------|
| 1    | Developers need mental models, not code   |
| 2    | Graph becomes too dense to navigate       |
| 3    | React Flow for graph visualization        |
| 4    | Waypoints                                 |
| 5    | Tours                                     |
| 6    | Read the spec before writing components   |

## State Transitions

### Waypoint lifecycle

```
(none) --[Create]--> exists --[Edit]--> exists
                           --[Delete]--> (none) + cascade edges + cascade tour refs
```

### Tour navigation

```
(no tour) --[Select tour]--> step 0
step N --[Next, N < last]--> step N+1
step N --[Prev, N > 0]---> step N-1
step last --[Finish/Exit]--> (no tour)
(any step) --[Select different tour]--> new tour step 0
```

### Selection

```
(nothing selected) --[Click node]--> waypoint selected
waypoint selected  --[Click same node]--> waypoint selected (no change)
waypoint selected  --[Click other node]--> other waypoint selected
tour step active   --[tour advances]--> sets selectedWaypointId = tour step waypoint
```
