# UI Contracts: Tour Focus Mode and Edge Labels

**Feature**: `004-tour-focus-edge-labels` | **Date**: 2026-05-22

---

## WaypointGraph (`app/components/WaypointGraph.tsx`)

### Updated props interface

```ts
interface WaypointGraphProps {
  waypoints: Waypoint[];
  edges: WaypointEdge[];
  selectedWaypointId: string | null;
  activeTourWaypointIds: string[];                              // ← new
  onSelectWaypoint: (id: string | null) => void;
  onConnect: (connection: {                                      // ← label added
    source: string;
    target: string;
    label?: string;
  }) => void;
  onDeleteEdge: (id: string) => void;
  onDeleteWaypoint: (id: string) => void;
  onNodePositionChange: (id: string, position: { x: number; y: number }) => void;
  onAddWaypointClick: () => void;
}
```

### Tour Focus Mode — node opacity contract

```
When activeTourWaypointIds is non-empty:
  - Node where waypoint.id IS in activeTourWaypointIds  → style: undefined (full opacity)
  - Node where waypoint.id NOT in activeTourWaypointIds → style: { opacity: 0.2 }

When activeTourWaypointIds is empty:
  - All nodes → style: undefined (full opacity)
```

### Tour Focus Mode — edge opacity contract

```
When activeTourWaypointIds is non-empty:
  - Edge where source OR target IS in activeTourWaypointIds → style: undefined (full opacity)
  - Edge where BOTH source AND target NOT in activeTourWaypointIds → style: { opacity: 0.2 }

When activeTourWaypointIds is empty:
  - All edges → style: undefined (full opacity)
```

### Edge Labels — display contract

```
For each WaypointEdge passed as a prop:
  - If edge.label is a non-empty string → pass label: edge.label to the React Flow edge object
  - If edge.label is undefined or empty  → omit label prop (React Flow renders no label)
```

### Edge Label Prompt — interaction contract

```
State:
  pendingConnection: { source: string; target: string } | null  (null = prompt closed)
  pendingLabel: string  (current input value)

Trigger:
  When React Flow fires onConnect with a valid source ≠ target connection:
    → set pendingConnection = { source, target }
    → set pendingLabel = ''
    → do NOT call onConnect prop yet

While pendingConnection is non-null, render a centered overlay with:
  - A short instruction text
  - A text input for the edge label (autoFocus)
  - "Add Connection" button → confirmConnect()
  - "Cancel" button → cancelConnect()
  - Enter key → confirmConnect()
  - Escape key → cancelConnect()

confirmConnect():
  call onConnect({ source: pendingConnection.source, target: pendingConnection.target,
                   label: pendingLabel.trim() || undefined })
  set pendingConnection = null

cancelConnect():
  set pendingConnection = null  (edge NOT created)
```

---

## ShrimpApp (`app/components/ShrimpApp.tsx`)

### activeTourWaypointIds computation

```ts
// Derived from existing activeTour state — no new state variable needed:
const activeTourWaypointIds = activeTour?.waypointIds ?? [];

// Pass to WaypointGraph:
<WaypointGraph
  activeTourWaypointIds={activeTourWaypointIds}
  ...
/>
```

### addEdge handler — updated signature

```ts
// Connection type gains label:
const addEdge = useCallback(
  (connection: { source: string; target: string; label?: string }) => {
    if (connection.source === connection.target) return;
    const id = `e-${Date.now()}`;
    const newEdge: WaypointEdge = { id, ...connection };
    // ... rest of optimistic pattern unchanged
  },
  [clearErrorAfterDelay],
);
```

No other changes to `ShrimpApp.tsx`.
