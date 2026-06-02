# Research: Waypoint Type Filter

**Feature**: 005-waypoint-type-filter | **Date**: 2026-06-01

No external unknowns required resolution — this feature uses only existing in-project dependencies (React state, React Flow memos, Tailwind CSS). The decisions below document the design choices made during planning.

---

## Decision 1: Where filter state lives

**Decision**: `filterState` lives in `ShrimpApp` (root state), passed to `WaypointGraph` via props.

**Rationale**: The spec explicitly requires this. Consistent with every other piece of shared state in the app (waypoints, edges, tours all live in ShrimpApp). Avoids prop-drilling by co-locating with all other state; the three-panel layout only has one component tree.

**Alternatives considered**:
- Local state inside `WaypointGraph` — simpler, but the spec says state must live in ShrimpApp. Also, future features might want to read filter state from other panels (e.g., a "show only selected type" button in the detail panel).
- Global store (Zustand, Context) — unnecessary for a single-user app with one client root.

---

## Decision 2: How edge hiding is computed

**Decision**: Edges are hidden when either their `source` or `target` waypoint is in the hidden set. Computed inside the existing `rfEdges` memo in `WaypointGraph`.

**Rationale**: Consistent with how tour focus mode already hides edges (see `style: { opacity: 0.2 }` in the existing `rfEdges` memo). For filter, we go further — we completely exclude the edge from the `rfEdges` array rather than just reducing opacity. This is cleaner: React Flow does not create DOM nodes for excluded edges, avoiding stale interaction targets.

**Alternatives considered**:
- Opacity-only (like tour focus) — rejected because a hidden node should mean "not there", not "faded but clickable".
- Hiding via CSS `display:none` — not possible with React Flow's node/edge model; must exclude from array.

**Implementation**: Compute `hiddenNodeIds = new Set(waypoints.filter(w => !filterState[w.type]).map(w => w.id))`, then filter both the nodes array and rfEdges array.

---

## Decision 3: Source of truth for the WAYPOINT_TYPES list

**Decision**: Export `WAYPOINT_TYPES` as a typed constant from `app/lib/types.ts`. Remove the duplicate local array from `WaypointForm.tsx`.

**Rationale**: The filter panel needs to iterate over all types to render toggles. `WaypointForm.tsx` already has a local `WAYPOINT_TYPES` array but it's not exported. Centralising in `types.ts` ensures the filter panel and form always stay in sync — adding a new type in future automatically appears in both with zero extra work.

**Alternatives considered**:
- Keep it in `WaypointForm.tsx` and import from there — creates an unexpected import direction (Graph → Form is semantically wrong).
- Derive from `WAYPOINT_COLORS` keys — fragile; key order in a Record is not guaranteed in all runtimes.
- Keep both copies in sync manually — rejected: duplication with no benefit.

---

## Decision 4: Filter panel open/closed state

**Decision**: `filterPanelOpen` boolean lives as local state inside the `Graph` function (inside `WaypointGraph.tsx`), not in `ShrimpApp`.

**Rationale**: Whether the filter dropdown is open is a pure UI display concern with no bearing on any other component. It resets naturally when the panel is closed; there is no need for ShrimpApp to know or care. Consistent with how `pendingConnection` and `selectedEdgeId` are already local state in `Graph`.

**Alternatives considered**:
- In ShrimpApp — unnecessary prop-threading for a purely local UI toggle.

---

## Decision 5: Filter panel dismiss behaviour

**Decision**: Clicking the Filter button toggles the panel open/closed. Clicking outside the panel (clicking the graph canvas) closes it via the existing `onPaneClick` handler augmented to also close the filter panel when open.

**Rationale**: Standard dropdown behaviour. The pane click handler already calls `onSelectWaypoint(null)`. Extending it to also close the filter panel requires one line change and is the least surprising behaviour.

**Alternatives considered**:
- `onBlur` on the panel div — works in isolation but unreliable with React Flow's canvas event handling.
- Separate overlay — adds visual weight; unwarranted for a lightweight toolbar dropdown.
