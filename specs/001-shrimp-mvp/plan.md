# Implementation Plan: Shrimp 2.0 MVP — Understanding Map

**Branch**: `001-shrimp-mvp` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-shrimp-mvp/spec.md`

## Summary

Build the Shrimp 2.0 MVP: a three-panel web app (tour selector top, graph left, detail right) that lets
users explore and create understanding maps for software projects. Waypoints are typed graph nodes;
tours are ordered paths through them. All data lives in React client state populated from hard-coded
mock data representing Shrimp itself. No persistence, no auth, no external services.

## Technical Context

**Language/Version**: TypeScript 5 (strict: true), React 19.2.4

**Primary Dependencies**: Next.js 16.2.6 (App Router), @xyflow/react 12.10.2, Tailwind CSS 4

**Storage**: None — all state in React `useState` at the root client component; resets on page refresh

**Testing**: Not in scope for MVP (spec does not request tests)

**Target Platform**: Desktop browser, 1280px minimum viewport

**Project Type**: Web application (single-page, client-rendered)

**Performance Goals**: App loads and renders mock data in under 2 seconds on standard laptop (SC-005)

**Constraints**: Desktop only; no mobile layout; no `any` types; no persistence

**Scale/Scope**: Single session, single user, ~12 mock waypoints, 2 sample tours

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Simplicity**: React Flow handles all graph rendering complexity. State is a single flat
  object at the root. No abstraction layers, no repository pattern, no service layer.
- [x] **II. Incremental Growth**: Five user stories are independently implementable in priority order
  (P1 read-only → P2 tours → P3 create → P4 connect → P5 tour edit); each leaves the app runnable.
- [x] **III. Intent Before Implementation**: Spec is complete with 5 user stories, acceptance
  criteria, clarifications on deletion cascade, connection interaction, and sample data subject.
- [x] **IV. Clean TypeScript**: `strict: true` already enabled; types.ts started; no `any` planned.
- [x] **V. Minimal UI**: Three panels only (top bar, left graph, right detail). No decoration.
  Every interactive element serves a named functional requirement.

All gates pass. ✅

## Project Structure

### Documentation (this feature)

```text
specs/001-shrimp-mvp/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── ui-contracts.md  # Component prop contracts and state shape
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
app/
├── layout.tsx                  # Root layout (exists — minimal, do not modify)
├── page.tsx                    # Root page — imports ShrimpApp, no logic
├── globals.css                 # Global styles (exists — add React Flow import)
├── lib/
│   ├── types.ts                # Type definitions (exists — extend as needed)
│   ├── mock-data.ts            # Hard-coded Shrimp-about-itself waypoints + tours
│   └── waypoint-colors.ts      # Type → color/label mapping (display constants)
└── components/
    ├── ShrimpApp.tsx           # 'use client' root — holds all AppState in useState
    ├── TourBar.tsx             # Top bar: tour selector dropdown + step nav controls
    ├── WaypointGraph.tsx       # React Flow canvas (left panel, 'use client')
    ├── WaypointDetail.tsx      # Right detail panel: read + edit/delete actions
    └── WaypointForm.tsx        # Create/edit waypoint modal or slide-in panel
```

**Structure Decision**: Next.js App Router, single web app. `app/page.tsx` is a Server Component
that imports `ShrimpApp` (a Client Component). All interactive state lives in `ShrimpApp`. React Flow
requires `'use client'`; components that use it are Client Components. No backend, no API routes.

## Complexity Tracking

No constitution violations. No complexity justification required.

## Implementation Notes

### React Flow integration

- Import `ReactFlow`, `ReactFlowProvider`, `Background`, `Controls`, `Handle`, `Position` from
  `@xyflow/react`.
- Add `import '@xyflow/react/dist/style.css'` in `app/globals.css` or in the component.
- Use controlled `nodes`/`edges` state derived from `AppState.waypoints` and `AppState.edges`.
- Map each `Waypoint` → `Node` (React Flow node) with `data: { waypoint }` and a custom node type
  that renders the waypoint's type-colored label.
- Use `onConnect` to handle drag-connection creation (FR-012).
- Use `onNodesChange` to handle node position drag updates within the session.
- Use `onNodesDelete` / `onEdgesDelete` to handle deletion (cascade logic runs in `ShrimpApp`).

### State shape

See `data-model.md` for the canonical `AppState` type. All mutations go through handler functions
defined in `ShrimpApp` and passed as props to children. No shared context needed for MVP — the
component tree is shallow enough that prop-passing suffices.

### Tailwind CSS 4

Tailwind 4 uses `@import "tailwindcss"` in `globals.css` — not the v3 `@tailwind` directives.
No `tailwind.config.js` needed unless customizing theme.

### Tour navigation

Active tour state: `activeTourId: string | null`, `activeTourStep: number`. When a tour step
changes, `selectedWaypointId` is set to the waypoint at that step and the graph highlights it.
Highlight is achieved by adding a `selected: true` flag to the matching React Flow node.
