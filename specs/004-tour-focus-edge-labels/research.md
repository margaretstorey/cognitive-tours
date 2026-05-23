# Research: Tour Focus Mode and Edge Labels

**Feature**: `004-tour-focus-edge-labels` | **Date**: 2026-05-22

No unknowns. The user provided the complete technical approach. This document records key
decisions for traceability.

---

## Decision 1: React Flow `style.opacity` for dimming

**Decision**: Use React Flow's built-in `style` prop on `Node` and `Edge` objects to set
`opacity: 0.2` on non-tour elements. No CSS class toggling, no custom node type changes.

**Rationale**: React Flow applies `style` directly to the node/edge DOM element. It's the
standard mechanism for per-element visual customisation without custom renderers. Setting
`opacity` at the element level also dims the label, handles, and selection ring — consistent
with the user's intent to visually de-emphasise the element as a whole.

**Alternatives considered**:
- CSS class toggle on a wrapping element: would require custom node types and class injection,
  much more code for the same result.
- Dimming via custom `WaypointNode` prop: would require adding an `isDimmed` prop to the node
  data object and styling inside the custom component. More complex with no benefit.

---

## Decision 2: Native React Flow edge label rendering

**Decision**: Pass `label: e.label` on each React Flow `Edge` object. React Flow renders the
label natively near the midpoint of the edge.

**Rationale**: React Flow's built-in label rendering requires zero additional code — just
including the `label` property on the edge. It handles positioning, wrapping, and click-through
automatically. No custom `EdgeLabel` component is needed at this scale.

**Alternatives considered**:
- Custom edge component with a `<EdgeLabelRenderer>`: more control over styling but far more
  code for what amounts to plain text display.

---

## Decision 3: Local state prompt in the Graph component

**Decision**: Store `pendingConnection` and `pendingLabel` in `useState` inside the `Graph`
component. The prompt is a `position: absolute` overlay rendered inside the graph's parent div.

**Rationale**: The prompt is ephemeral UI — it exists only during the brief moment between
drag-release and edge confirmation. It does not need to be in ShrimpApp state, passed as props,
or stored in a context. Local state is the simplest correct solution.

**Alternatives considered**:
- Modal component in ShrimpApp triggered by a callback: would require lifting state up and
  adding a new callback prop, adding complexity with no benefit.
- Storing pending connection in ShrimpApp: unnecessary — ShrimpApp only needs to know about
  the edge after it is confirmed.

---

## Decision 4: `addEdge` accepts `label?: string`

**Decision**: Change `addEdge`'s connection parameter type to include `label?: string`. The
label is spread into the `WaypointEdge` object. No API route change is needed because the
existing `POST /api/edges` route already sends the full `newEdge` object as JSON, which will
include `label` if set.

**Rationale**: `WaypointEdge.label` already exists in the type and the API contract already
handles it. The only missing piece was the path from the drag event to the edge object — adding
`label?` to the `addEdge` parameter closes that gap with minimal change.

---

## Decision 5: Pass `activeTourWaypointIds` not `activeTourId` + tours

**Decision**: Compute `activeTour?.waypointIds ?? []` in ShrimpApp and pass the resulting
`string[]` to WaypointGraph as `activeTourWaypointIds`.

**Rationale**: WaypointGraph doesn't need to know about tours — it only needs the set of
waypoint IDs that are currently highlighted. Passing the derived set keeps the prop surface
minimal and the Graph component's concerns narrow. WaypointGraph remains a pure visual
component that receives its display state, not the raw tour objects.
