# Data Model: Tour Focus Mode and Edge Labels

**Feature**: `004-tour-focus-edge-labels` | **Date**: 2026-05-22

## No data model changes

Neither feature modifies the `Waypoint`, `WaypointEdge`, `Tour`, or `AppState` types. No Prisma
schema changes. No database migrations. No API route changes.

The `WaypointEdge.label?: string` field already exists and is already persisted. The only change
is that the value is now used by `WaypointGraph.tsx` when constructing the React Flow edge list.

## Prop changes

### WaypointGraph.tsx — new prop

```ts
interface WaypointGraphProps {
  // ...existing props unchanged...
  activeTourWaypointIds: string[];   // ← new
}
```

`activeTourWaypointIds` is empty (`[]`) when no tour is active. When a tour is active, it
contains the `waypointIds` of that tour. The Graph component uses this array to compute `opacity`
on each node and edge.

### WaypointGraph.tsx — onConnect prop type change

```ts
// Before:
onConnect: (connection: { source: string; target: string }) => void;

// After:
onConnect: (connection: { source: string; target: string; label?: string }) => void;
```

### ShrimpApp.tsx — addEdge handler signature change

```ts
// Before:
const addEdge = useCallback((connection: { source: string; target: string }) => { ... }, [...]);

// After:
const addEdge = useCallback((connection: { source: string; target: string; label?: string }) => { ... }, [...]);
```

The `label` is spread into the `WaypointEdge` object. `WaypointEdge.label` is already `string |
undefined`, so this is a non-breaking additive change.

## New local state in Graph component (WaypointGraph.tsx)

```ts
const [pendingConnection, setPendingConnection] = useState<{
  source: string;
  target: string;
} | null>(null);
const [pendingLabel, setPendingLabel] = useState('');
```

These are purely ephemeral UI state — they exist only during the label prompt interaction and
are never surfaced outside `WaypointGraph.tsx`.
