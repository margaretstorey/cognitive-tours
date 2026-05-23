# Implementation Plan: Tour Focus Mode and Edge Labels

**Branch**: `004-tour-focus-edge-labels` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-tour-focus-edge-labels/spec.md`

## Summary

Two graph UX improvements, both contained within `WaypointGraph.tsx` with small supporting
changes to `ShrimpApp.tsx`. Tour Focus Mode: pass `activeTourWaypointIds` to the graph and use
React Flow's `style.opacity` prop on nodes and edges to dim non-tour elements when a tour is
active. Edge Labels: pass the existing `label` field to React Flow edges so they render natively;
intercept `onConnect` with local state to show an optional label prompt before the edge is
committed.

## Technical Context

**Language/Version**: TypeScript 5 (strict: true), React 19.2.4

**Primary Dependencies**: Next.js 16.2.6 (App Router), @xyflow/react 12.10.2, Tailwind CSS 4

**Storage**: No changes

**Testing**: Not in scope

**Target Platform**: Desktop browser

**Project Type**: Additive UI changes to existing web application

**Performance Goals**: No new performance requirements; opacity changes are CSS-only

**Constraints**: strict TypeScript; no new files; no data model changes; no backend changes

**Scale/Scope**: Two focused changes in 2 existing files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Simplicity**: React Flow's built-in `style` prop handles opacity — no custom CSS,
  no animation library. The label prompt is a local `useState` inside the Graph component —
  no new context, no shared state. Both features use the minimum viable mechanism.
- [x] **II. Incremental Growth**: Tour focus and edge labels are independent; either can be
  implemented and verified alone. Each leaves the app runnable.
- [x] **III. Intent Before Implementation**: Spec defines both features with acceptance scenarios
  and edge cases (mixed-edge behaviour, cancel behaviour, empty-label behaviour).
- [x] **IV. Clean TypeScript**: `activeTourWaypointIds: string[]`, `pendingConnection:
  { source: string; target: string } | null` — all clean typed state; no `any`.
- [x] **V. Minimal UI**: The label prompt is a small inline overlay with two buttons and one
  input. The opacity change is invisible until a tour is active. Both elements serve named
  functional requirements.
- [x] **VI. Universal Waypoints & Tours**: Tour focus works for all waypoint types; edge labels
  are domain-agnostic strings.
- [x] **VII. Flexible Navigation**: Focus mode applies equally to code-linked and intent-only
  waypoints — determined solely by tour membership, not waypoint type.
- [x] **VIII. Human and Agent Readable**: No waypoint content changes; edge labels are
  plain user-typed strings.

All gates pass. ✅

## Project Structure

### Documentation (this feature)

```text
specs/004-tour-focus-edge-labels/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (prop changes, no data model changes)
├── contracts/
│   └── ui-contracts.md  # Component prop and behaviour contracts
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code changes (repository root)

```text
app/
├── components/
│   ├── WaypointGraph.tsx   # Major changes: new prop, opacity styling, label prompt, label display
│   └── ShrimpApp.tsx       # Two small changes: pass activeTourWaypointIds, update addEdge label
```

**Structure Decision**: Zero new files. Both changes are self-contained in existing components.

## Complexity Tracking

No constitution violations. No complexity justification required.

## Implementation Notes

### Tour Focus Mode — React Flow opacity

React Flow's `Node` and `Edge` types both accept a `style` prop. Passing `style={{ opacity:
0.2 }}` makes a node or edge visually faint while leaving it interactive (clickable, hoverable).

In `WaypointGraph.tsx`:
- New prop: `activeTourWaypointIds: string[]` (empty array when no tour is active)
- Derived boolean per node: `isInTour = activeTourWaypointIds.length === 0 || activeTourWaypointIds.includes(w.id)`
- Node gets `style: isInTour ? undefined : { opacity: 0.2 }`
- Edge dimming: both endpoints must be outside the tour — `!activeTourWaypointIds.includes(e.source) && !activeTourWaypointIds.includes(e.target)`
- Edge gets `style: isDimmed ? { opacity: 0.2 } : undefined`

In `ShrimpApp.tsx`:
- Compute `activeTourWaypointIds = activeTour?.waypointIds ?? []`
- Pass to `<WaypointGraph activeTourWaypointIds={activeTourWaypointIds} />`

### Edge Labels — React Flow native label prop

React Flow renders an `Edge` label natively when the `label` property is a non-empty string.
The current code omits `label` entirely from the React Flow edge objects. Fix: add `label:
e.label` to the `rfEdges` mapping. Undefined labels render nothing.

### Edge Label Prompt — local state in Graph component

The `Graph` component (inside `WaypointGraph.tsx`) gains two new state variables:

```ts
const [pendingConnection, setPendingConnection] = useState<{ source: string; target: string } | null>(null);
const [pendingLabel, setPendingLabel] = useState('');
```

The `handleConnect` callback no longer calls `onConnect` immediately. Instead it stores the
pending connection and opens the prompt. Confirm and cancel handlers call or discard it.

The prompt is a small overlay (`absolute inset-0 z-10 flex items-center justify-center`)
containing a text input, a "Add Connection" button, and a "Cancel" button. Enter key confirms;
Escape key cancels.

### ShrimpApp.addEdge — label support

The existing `addEdge` handler signature changes from `(connection: { source: string; target:
string })` to `(connection: { source: string; target: string; label?: string })`. The `label`
is spread into the new `WaypointEdge` alongside `id`. `WaypointEdge.label` is already `string |
undefined` in the type, so no type change is needed there.

The existing optimistic API call `POST /api/edges` already sends `JSON.stringify(newEdge)` which
will include `label` if present — no API route change needed.
