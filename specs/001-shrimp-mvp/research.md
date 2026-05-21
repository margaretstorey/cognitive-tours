# Research: Shrimp 2.0 MVP

**Date**: 2026-05-21 | **Branch**: `001-shrimp-mvp`

## React Flow (@xyflow/react v12) — Integration Patterns

**Decision**: Use `@xyflow/react` v12 controlled-flow API with custom node types.

**Rationale**: The package is already installed (v12.10.2). The controlled API (`nodes`/`edges` as
React state) integrates naturally with the `AppState` model. Custom node types allow type-colored
rendering without hacking node styles externally.

**Key APIs**:
- `<ReactFlow nodes={} edges={} onConnect={} onNodesChange={} onEdgesChange={} nodeTypes={} />`
- `useNodesState` / `useEdgesState` — convenience hooks that wrap `useState` + `applyNodeChanges`
- `onConnect: (connection: Connection) => void` — fired when user drags handle to handle
- `Handle` component — renders the drag target/source on custom nodes; required for `onConnect`
- `ReactFlowProvider` — must wrap `ReactFlow` if used outside a single component
- `import '@xyflow/react/dist/style.css'` — required for default styling

**Alternatives considered**:
- D3.js — rejected; too low-level, significant custom rendering work for no benefit over React Flow
- Cytoscape.js — rejected; heavier, less idiomatic in React, no TypeScript-first API

---

## Next.js 16 + React Flow — Client/Server Boundary

**Decision**: `ShrimpApp` is a `'use client'` root component. `app/page.tsx` is a Server Component
that simply renders `<ShrimpApp />`.

**Rationale**: React Flow uses browser APIs (`ResizeObserver`, `requestAnimationFrame`) that are
unavailable in Server Components. The entire interactive surface of the app is client-side.
Keeping `page.tsx` as a Server Component is a formality here; it costs nothing.

**Pattern**:
```tsx
// app/page.tsx — Server Component
import ShrimpApp from './components/ShrimpApp'
export default function Page() {
  return <ShrimpApp />
}

// app/components/ShrimpApp.tsx
'use client'
// ... all state and handlers here
```

---

## State Management — Props vs Context

**Decision**: Pass state and handlers as props. No React Context for MVP.

**Rationale**: The component tree is at most 3 levels deep (ShrimpApp → TourBar/WaypointGraph/
WaypointDetail → WaypointForm). Prop-passing is simpler and more legible at this scale.
Constitution Principle I (Simplicity) forbids introducing Context before it is needed by 2+
concrete use cases.

**Revisit**: If WaypointForm needs access to the full waypoints list from inside WaypointDetail,
extract a `WaypointFormContext` at that point only.

---

## Tailwind CSS 4 — Setup Differences from v3

**Decision**: Use `@import "tailwindcss"` in `globals.css`. No config file needed.

**Rationale**: Tailwind CSS 4 drops the `@tailwind base/components/utilities` directives.
The single `@import` replaces all three. The `@tailwindcss/postcss` plugin in devDependencies
handles the transformation. Project already has this configured.

**Watch out**: v4 changed the dark mode and arbitrary value syntax in some areas. Keep styles
simple for MVP; avoid complex Tailwind features.

---

## Waypoint Type Visual Differentiation

**Decision**: Map each of the 8 waypoint types to a distinct background color in the graph node.

**Rationale**: SC-004 requires 80% correct type identification at a glance. Color is the fastest
visual signal. A `waypoint-colors.ts` module centralizes the type→color mapping so it can be
reused in both graph nodes and the detail panel's type badge.

**Color mapping** (Tailwind bg classes):

| Type            | Color class         | Hex approx |
|-----------------|---------------------|------------|
| User Need       | `bg-blue-100`       | light blue |
| Feature         | `bg-green-100`      | light green |
| ADR             | `bg-yellow-100`     | light yellow |
| Code Component  | `bg-purple-100`     | light purple |
| Test            | `bg-teal-100`       | light teal |
| Risk            | `bg-red-100`        | light red |
| AI Instruction  | `bg-orange-100`     | light orange |
| Open Question   | `bg-gray-100`       | light gray |

---

## Mock Data Design — Shrimp About Itself

**Decision**: 12 waypoints representing Shrimp's own design; 2 tours with 5–6 steps each.

**Rationale**: Using Shrimp itself as the example project (agreed in clarification Q3) maximizes
the tool's communicative value on first load and avoids inventing a fictional project.

**Tour 1 — "New Developer Orientation"** (P1 priority: read/explore experience):
Steps: User Need → Feature: Waypoints → Feature: Tours → Code Component: ShrimpApp →
       ADR: Local State Only → Open Question: Export

**Tour 2 — "Why Waypoints and Tours Exist"** (rationale/philosophy tour):
Steps: User Need → Risk: Graph Too Dense → ADR: React Flow → Feature: Waypoints →
       Feature: Tours → AI Instruction

See `data-model.md` for the full mock data definitions.

---

## Deletion Cascade — Implementation Strategy

**Decision**: Handle cascade in `ShrimpApp` before updating state.

**Rationale**: Cascade logic (remove edges referencing deleted waypoint, remove waypoint from
tour step lists) is 3–5 lines of `Array.filter`. No need for a separate utility layer.

**Pattern**:
```ts
function deleteWaypoint(id: string) {
  setWaypoints(prev => prev.filter(w => w.id !== id))
  setEdges(prev => prev.filter(e => e.source !== id && e.target !== id))
  setTours(prev => prev.map(t => ({
    ...t,
    waypointIds: t.waypointIds.filter(wid => wid !== id)
  })))
  if (selectedWaypointId === id) setSelectedWaypointId(null)
}
```
