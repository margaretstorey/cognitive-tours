# Tasks: Phase 2 — Persistence

**Input**: Design documents from `/specs/002-persistence-todos/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md,
quickstart.md

**Tests**: Not explicitly requested in the spec for this phase — no test tasks generated.

**Organization**: Single user story (US1). API route tasks are grouped and parallelizable;
ShrimpApp mutation conversions are sequential (same file).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[US1]**: Belongs to User Story 1 — Data Survives a Page Refresh

---

## Phase 1: Setup (Prisma + SQLite installation)

**Purpose**: Install dependencies and initialize the Prisma project.

- [x] T001 Install `prisma` and `@prisma/client` packages: `npm install prisma @prisma/client`
- [x] T002 Run `npx prisma init --datasource-provider sqlite`; in the generated `.env` change `DATABASE_URL` to `"file:./prisma/dev.db"`; confirm `prisma/dev.db` is listed in `.gitignore` (add it if not)
- [x] T003 Write `prisma/schema.prisma` — replace template with full schema from data-model.md: `Waypoint`, `Edge`, `Tour`, `TourWaypoint` models (including `onDelete: Cascade` on `TourWaypoint.tour`)
- [x] T004 Run `npx prisma migrate dev --name init` to create `prisma/dev.db` and generate the typed Prisma client under `node_modules/@prisma/client`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Server-side infrastructure that all API routes depend on. Must be complete before any Route Handler is written.

**⚠️ CRITICAL**: No API route work can begin until this phase is complete.

- [x] T005 [P] Create `app/lib/db.ts` — Prisma client singleton using the global-caching pattern for Next.js dev hot-reload compatibility (see plan.md Implementation Notes)
- [x] T006 [P] Create `app/lib/db-mappers.ts` — three pure mapping functions per data-model.md: `toWaypoint(row)`, `toEdge(row)`, `toTour(row & { waypoints })` with explicit Prisma input types and AppState return types; no `any`

**Checkpoint**: Foundation ready — API route implementation can begin in parallel.

---

## Phase 3: User Story 1 — Data Survives a Page Refresh (Priority: P1) 🎯 MVP

**Goal**: All waypoints, edges, and tours are persisted in SQLite and survive a page reload.
The app loads persisted data on startup with a loading spinner. All mutations are optimistic.

**Independent Test**: Create two waypoints and one tour, reload the page, verify all three
items are present with the same content and connections (spec acceptance scenario 1).

### API Routes (T007–T013 can all run in parallel — different files)

- [x] T007 [P] [US1] Create `app/api/data/route.ts` — `GET` handler: query all `Waypoint`, `Edge`, `Tour` (with `TourWaypoint`); if waypoint count is zero, seed DB by inserting all records from `INITIAL_WAYPOINTS`, `INITIAL_EDGES`, `INITIAL_TOURS` in `app/lib/mock-data.ts` (preserve IDs); return `BulkDataResponse` shaped as `{ waypoints, edges, tours }` using mapper functions; return `500` with `{ error }` on DB failure
- [x] T008 [P] [US1] Create `app/api/waypoints/route.ts` — `POST` handler: parse body as `Waypoint`; write to DB using `prisma.waypoint.create` (map `position.x/y` → `posX/posY`); return created waypoint via `toWaypoint()`; return `400` for missing required fields, `500` on DB failure
- [x] T009 [P] [US1] Create `app/api/waypoints/[id]/route.ts` — `PUT` handler: parse body as partial `Waypoint`; update record using `prisma.waypoint.update`; return updated waypoint via `toWaypoint()`; return `404` if not found. `DELETE` handler: call `prisma.waypoint.delete`; return `{ id }`; return `404` if not found; return `500` on DB failure for both
- [x] T010 [P] [US1] Create `app/api/edges/route.ts` — `POST` handler: parse body as `WaypointEdge`; write to DB using `prisma.edge.create`; return created edge via `toEdge()`; return `400` for missing `source`/`target`, `500` on DB failure
- [x] T011 [P] [US1] Create `app/api/edges/[id]/route.ts` — `DELETE` handler: call `prisma.edge.delete`; return `{ id }`; return `404` if not found, `500` on DB failure
- [x] T012 [P] [US1] Create `app/api/tours/route.ts` — `POST` handler: parse body as `Tour` (with `waypointIds`); use `prisma.$transaction` to create `Tour` row and all `TourWaypoint` rows (index = `order`); return created tour via `toTour()`; return `400` for missing `name`, `500` on DB failure
- [x] T013 [P] [US1] Create `app/api/tours/[id]/route.ts` — `PUT` handler: if `waypointIds` is provided, use `prisma.$transaction` to `deleteMany` existing `TourWaypoint` rows then `createMany` new ones (index = `order`); update `Tour` fields; return updated tour via `toTour()`. `DELETE` handler: call `prisma.tour.delete` (cascades to `TourWaypoint`); return `{ id }`; return `404` if not found for both, `500` on DB failure

### ShrimpApp startup and UI state (T014–T017 are sequential — same file, set foundation for mutation tasks)

- [ ] T014 [US1] In `app/components/ShrimpApp.tsx`: change `waypoints`, `edges`, `tours` initial state from `INITIAL_*` arrays to `[]`; remove `INITIAL_*` imports; add `loadState: 'loading' | 'ready' | 'error'` state initialized to `'loading'`; add `errorMessage: string | null` state initialized to `null`
- [ ] T015 [US1] In `app/components/ShrimpApp.tsx`: add `useEffect` with empty dependency array that calls `fetch('/api/data')`, parses JSON as `BulkDataResponse`, sets `waypoints`/`edges`/`tours` from the response, then sets `loadState` to `'ready'`; on any error sets `loadState` to `'error'`
- [ ] T016 [US1] In `app/components/ShrimpApp.tsx`: add conditional render at the top of the return — when `loadState === 'loading'` render a centered full-screen spinner (Tailwind: `flex items-center justify-center h-screen`); when `loadState === 'error'` render a full-screen error message ("Could not load data. Please refresh."); otherwise render the existing three-panel layout
- [ ] T017 [US1] In `app/components/ShrimpApp.tsx`: add an error banner element rendered above `<TourBar>` that is visible when `errorMessage !== null` (Tailwind: `bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-2 text-sm`); add a `clearErrorAfterDelay` helper that sets a `setTimeout` to call `setErrorMessage(null)` after 5000 ms; call it from every mutation handler that sets `errorMessage`

### ShrimpApp mutation conversions (T018–T025 are sequential — same file, depend on T014 and T017)

- [ ] T018 [US1] In `app/components/ShrimpApp.tsx`: convert `createWaypoint` to optimistic pattern — snapshot `waypoints`, apply new waypoint to state, call `fetch('/api/waypoints', { method: 'POST', body: JSON.stringify(newWaypoint) })` in background; on catch restore snapshot via `setWaypoints(snapshot)` and call `setErrorMessage('Failed to save waypoint.')` then `clearErrorAfterDelay()`
- [ ] T019 [US1] In `app/components/ShrimpApp.tsx`: convert `updateWaypoint` to optimistic pattern — snapshot `waypoints`, apply update to state, call `fetch('/api/waypoints/'+id, { method: 'PUT', body: JSON.stringify(data) })` in background; on catch restore snapshot and `setErrorMessage('Failed to update waypoint.')`; call `clearErrorAfterDelay()`
- [ ] T020 [US1] In `app/components/ShrimpApp.tsx`: convert `onNodePositionChange` to optimistic pattern — apply position update to state immediately, fire `fetch('/api/waypoints/'+id, { method: 'PUT', body: JSON.stringify({ position }) })` in background; on catch restore waypoint snapshot (position changes are cosmetic but FR-003 requires revert-on-error)
- [ ] T021 [US1] In `app/components/ShrimpApp.tsx`: convert `deleteWaypoint` to optimistic pattern — snapshot `waypoints`, `edges`, and `tours`; apply cascade: filter waypoints, filter edges (remove source/target matches), map tours (remove waypoint from waypointIds); fire `fetch('/api/waypoints/'+id, { method: 'DELETE' })` then fire `fetch('/api/edges/'+e.id, { method: 'DELETE' })` for each removed edge, then fire `fetch('/api/tours/'+t.id, { method: 'PUT', body: JSON.stringify({ waypointIds: ... }) })` for each modified tour; on any catch restore all three snapshots and `setErrorMessage('Failed to delete waypoint.')`
- [ ] T022 [US1] In `app/components/ShrimpApp.tsx`: convert `addEdge` to optimistic pattern — snapshot `edges`, apply new edge to state, fire `fetch('/api/edges', { method: 'POST', body: JSON.stringify(newEdge) })` in background; on catch restore snapshot and `setErrorMessage('Failed to save connection.')`
- [ ] T023 [US1] In `app/components/ShrimpApp.tsx`: convert `deleteEdge` to optimistic pattern — snapshot `edges`, remove edge from state, fire `fetch('/api/edges/'+id, { method: 'DELETE' })` in background; on catch restore snapshot and `setErrorMessage('Failed to delete connection.')`
- [ ] T024 [US1] In `app/components/ShrimpApp.tsx`: convert `createTour` to optimistic pattern — snapshot `tours`, apply new tour to state, fire `fetch('/api/tours', { method: 'POST', body: JSON.stringify(newTour) })` in background; on catch restore snapshot and `setErrorMessage('Failed to save tour.')`
- [ ] T025 [US1] In `app/components/ShrimpApp.tsx`: convert `updateTour` to optimistic pattern — snapshot `tours`, apply update to state, fire `fetch('/api/tours/'+id, { method: 'PUT', body: JSON.stringify(data) })` in background; on catch restore snapshot and `setErrorMessage('Failed to update tour.')`

**Checkpoint**: User Story 1 fully functional — create waypoints/edges/tours, reload, verify all
data persists. Acceptance scenarios from spec.md should all pass.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [ ] T026 [P] Add `"postinstall": "prisma generate"` to `scripts` in `package.json` so the Prisma client is regenerated automatically after `npm install` (prevents stale generated code after schema changes)
- [ ] T027 Manually verify all four acceptance scenarios from spec.md User Story 1 in a running browser: (1) create waypoints+tours → reload → all present; (2) edit waypoint → reload → updated description shown; (3) delete waypoint → reload → absent; (4) create edge → reload → edge present

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion (needs Prisma client generated by T004)
- **API Routes (T007–T013)**: Depend on Foundational phase (need `db.ts` and `db-mappers.ts`)
- **ShrimpApp changes (T014–T025)**: T014–T017 depend on API routes being present to call; T018–T025 depend on T014–T017
- **Polish (Phase 4)**: Depends on all user story work being complete

### Within Phase 3

- T007–T013: all parallel (each is a separate file)
- T014 → T015 → T016 → T017: sequential (all `ShrimpApp.tsx`, each builds on prior)
- T018–T025: sequential (all `ShrimpApp.tsx`); each depends on T017

### Parallel Opportunities

```
Phase 1: T001 → T002 → T003 → T004 (sequential — each step depends on prior)

Phase 2: T005 and T006 can run in parallel (different files, no interdependency)

Phase 3 — API routes (all parallel after Phase 2 completes):
  Task: "Create app/api/data/route.ts (T007)"
  Task: "Create app/api/waypoints/route.ts (T008)"
  Task: "Create app/api/waypoints/[id]/route.ts (T009)"
  Task: "Create app/api/edges/route.ts (T010)"
  Task: "Create app/api/edges/[id]/route.ts (T011)"
  Task: "Create app/api/tours/route.ts (T012)"
  Task: "Create app/api/tours/[id]/route.ts (T013)"
```

---

## Implementation Strategy

### MVP First (this is the only user story)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T006)
3. Complete Phase 3 API routes: T007–T013 (can parallelize)
4. Complete Phase 3 ShrimpApp: T014–T025 (sequential)
5. **Validate**: Run acceptance scenarios T027

### Incremental Delivery Within Phase 3

Because the optimistic handlers (T018–T025) each wrap an existing handler independently,
they can be delivered one mutation type at a time while the app remains runnable. The
recommended sequence:
1. T014–T016 first (loading state + startup fetch) — validates `GET /api/data` and seeding
2. T017 (error banner) — UI infrastructure for all subsequent mutations
3. T018 (createWaypoint) — validates the `POST /api/waypoints` route
4. T021 (deleteWaypoint) — the most complex, validates cascade
5. T019–T020 then T022–T025 in any order

---

## Notes

- [P] tasks = different files, no shared state dependencies — safe to run in parallel
- [US1] maps every task to User Story 1 for traceability to spec acceptance criteria
- All Route Handlers must return typed JSON; use `Response.json()` per Next.js 16 docs
- No `any` anywhere — Prisma input/output types are available from `@prisma/client`
- Commit after Phase 2 checkpoint (T006) and after Phase 3 API checkpoint (T013) before starting ShrimpApp changes
