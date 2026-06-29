# Tasks: Docent Mode — Per-Step Tour Narrative

**Input**: Design documents from `specs/006-docent-mode/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅

**Tests**: No automated tests in scope — manual browser verification is the acceptance gate per project convention.

**Organization**: Grouped by user story. Phase 2 (Foundational) blocks all user stories and must fully complete before Phase 3+.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase (different files, no shared state)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

No new dependencies, directories, or tooling required. Proceed directly to Phase 2.

---

## Phase 2: Foundational — Schema, Types, and API (Blocking)

**Purpose**: Data layer changes that enable all three user stories. The app must compile and pass `tsc --noEmit` before Phase 3 begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Add `narrative String?` field to `TourWaypoint` model in `prisma/schema.prisma`
- [x] T002 Run `npx prisma db push` locally to apply schema and regenerate Prisma client in `app/generated/prisma/`
- [x] T003 In `app/lib/types.ts`: add `TourStop` interface (`waypointId: string; narrative?: string`); change `Tour.waypointIds: string[]` to `Tour.stops: TourStop[]`
- [x] T004 [P] In `app/lib/db-mappers.ts`: update `toTour()` to produce `stops: TourStop[]` from sorted `TourWaypoint` rows, mapping `tw.narrative` (omit key when null)
- [x] T005 [P] In `app/lib/mock-data.ts`: update `INITIAL_TOURS` — replace each `waypointIds: string[]` with `stops: TourStop[]` (narrative left undefined for all seed stops)
- [x] T006 [P] In `app/api/data/route.ts`: update seed loop — replace `t.waypointIds.map(...)` with `t.stops.map(s => ({ waypointId: s.waypointId, order, narrative: s.narrative ?? null }))` in the `waypoints.create` call
- [x] T007 [P] In `app/api/tours/route.ts`: update POST handler — accept `body.stops: TourStop[]`; map to `{ waypointId, order, narrative: s.narrative?.trim() || null }` in the Prisma `create` call
- [x] T008 [P] In `app/api/tours/[id]/route.ts`: update PUT handler — when `body.stops !== undefined`, delete and recreate `TourWaypoint` rows from `body.stops`, normalising empty narrative to null
- [x] T009 In `app/components/CognitiveToursApp.tsx`: fix all `waypointIds` references — `activeTourLength`, `selectTour`, `onNext`, `onPrev`, `deleteWaypoint` cascade filter/map, the API `PUT` body in `deleteWaypoint`, and the `activeTourWaypointIds` prop passed to `WaypointGraph`

**Checkpoint**: Run `npx tsc --noEmit` — zero errors. Start the dev server and confirm tours still load, navigate, and persist. No narrative visible yet.

---

## Phase 3: User Story 1 — Author Writes Narrative Per Stop (Priority: P1) 🎯 MVP

**Goal**: Tour authors can add optional free-form narrative to each stop when creating or editing a tour.

**Independent Test**: Create a new tour, add two stops, type narrative for one stop only, save. Reload the page. Narrative for the stop with text is preserved; the other stop has no narrative. Both stops are functional tour stops.

- [x] T010 [US1] In `app/components/TourBar.tsx`: change `TourEditorState.waypointIds: string[]` to `stops: TourStop[]`; update `openCreate` to initialise `stops: []`
- [x] T011 [US1] In `app/components/TourBar.tsx`: update `addWaypointToTour` (push `{ waypointId: id }`), `removeWaypointFromTour` (filter by index on stops), `moveWaypoint` (swap stops by index), and `saveEditor` (pass `stops` to `onCreateTour` / `onUpdateTour`)
- [x] T012 [US1] In `app/components/TourBar.tsx`: update `openEdit` to populate `stops` from `tour.stops` (copies narrative values so existing narrative appears in text areas)
- [x] T013 [US1] In `app/components/TourBar.tsx`: in the editor modal's stop list (`editor.stops.map(...)`), add a `<textarea>` below each stop's label row — `value={stop.narrative ?? ''}`, `onChange` updates `stops[idx].narrative`, `rows={2}`, `placeholder="Narrative for this stop (optional)"`, Tailwind: `text-sm border border-gray-200 rounded px-2 py-1 mt-1 w-full resize-none`

**Checkpoint**: Open the app. Create a tour, add stops, type narrative in one stop's textarea. Save. The tour saves. Open the editor again — narrative is pre-populated. Reload the page — narrative survives.

---

## Phase 4: User Story 2 — Reader Sees Narrative While Stepping (Priority: P1)

**Goal**: Tour readers see the current stop's narrative in a highlighted area below the tour bar, updating as they step Prev/Next.

**Independent Test**: Enter a tour that has narrative on some stops. Step through. Stops with narrative show the text; stops without narrative show no box or gap below the tour bar.

- [x] T014 [US2] In `app/components/CognitiveToursApp.tsx`: derive `const currentNarrative = activeTour?.stops[activeTourStep]?.narrative?.trim() ?? ''`
- [x] T015 [US2] In `app/components/CognitiveToursApp.tsx`: render the narrative area immediately below `<TourBar ... />` and above the `<div className="flex flex-1 ...">` — conditionally: `{currentNarrative && (<div className="bg-amber-50 border-l-4 border-amber-400 text-sm text-amber-900 px-4 py-2 shrink-0">{currentNarrative}</div>)}`

**Checkpoint**: Author narrative on two stops of a tour. Enter the tour as a reader. Step through all stops — narrative appears on stops that have it, no element appears on stops that don't. Press Prev — narrative updates correctly.

---

## Phase 5: User Story 3 — Author Updates Narrative After Creation (Priority: P2)

**Goal**: Confirm the edit flow pre-populates narrative and that clearing narrative removes it.

**Note**: The implementation for US3 is already complete after Phase 3 (T012 handles pre-population; T011 handles save). This phase is explicit verification of the update flow and the null-normalisation path.

- [ ] T016 [US3] Verify edit flow end-to-end: open an existing tour with narrative, confirm text areas pre-populate correctly; edit the narrative on one stop and clear it on another; save; verify the edited stop shows new text and the cleared stop shows nothing in the reader view. Confirm behaviour via browser reload (persistence check).

**Checkpoint**: All acceptance scenarios from User Stories 1, 2, and 3 pass in a running browser session.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T017 Push schema change to Turso production database: `TURSO_DATABASE_URL=<url> TURSO_AUTH_TOKEN=<token> npx prisma db push` (confirm with user before running; production env vars required)
- [ ] T018 Manual smoke test on Vercel preview deployment: verify narrative round-trips correctly against Turso (create tour with narrative, reload, confirm persistence)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: No dependencies — start immediately
- **Phase 3 (US1)**: Depends on Phase 2 completion (types and API must be correct)
- **Phase 4 (US2)**: Depends on Phase 3 completion (narrative must be saved before it can be displayed)
- **Phase 5 (US3)**: Depends on Phase 3 completion (editor edit flow must exist)
- **Phase 6 (Polish)**: Depends on Phases 3, 4, and 5 complete

### Within Phase 2 (Foundational)

```
T001 → T002 → T003 → [T004, T005, T006, T007, T008 in parallel] → T009
```

T004–T008 are independent of each other (different files) and can run in parallel after T003.

### Within Phase 3 (US1)

```
T010 → T011 → T012 → T013
```

All sequential: each builds on changes to `TourBar.tsx` made in the previous step.

### Within Phase 4 (US2)

```
T014 → T015
```

T015 uses the `currentNarrative` derived in T014 (same file, sequential).

---

## Parallel Opportunities

### Phase 2 — after T003 completes

```
Run simultaneously (different files, no shared state):
  T004  app/lib/db-mappers.ts
  T005  app/lib/mock-data.ts
  T006  app/api/data/route.ts
  T007  app/api/tours/route.ts
  T008  app/api/tours/[id]/route.ts
```

---

## Implementation Strategy

### MVP (Phases 2–4 only)

1. Complete Phase 2: Foundational — verify with `tsc --noEmit`
2. Complete Phase 3: US1 — authors can write and save narrative
3. Complete Phase 4: US2 — readers see narrative while stepping
4. **STOP and validate** — all P1 acceptance criteria pass in browser
5. Phase 5 (US3 verification) and Phase 6 (Turso push + smoke test) follow

### Incremental Delivery

Phases 2 → 3 → 4 each leave the app in a better, fully runnable state:
- After Phase 2: existing functionality unchanged, types clean
- After Phase 3: authors can create and save narrative
- After Phase 4: readers see narrative — full feature visible end-to-end

---

## Notes

- [P] tasks touch different files with no shared mutable state — safe to run concurrently if working in parallel
- No automated tests exist in this project — manual browser verification is the gate
- T016 is a verification task, not a code change; mark it complete after confirming the edit flow passes all US3 acceptance scenarios
- T017 requires production credentials — confirm with the repo owner before executing
- After T002, run the dev server once to confirm existing tours still load before touching any TypeScript
