# Tasks: Waypoint File Path

**Input**: Design documents from `/specs/003-waypoint-filepath/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contracts.md

**Tests**: Not explicitly requested — no test tasks generated.

**Organization**: Single user story (US1). Schema + migration must run first; type + mapper
are blocking prerequisites; all UI and API changes are then parallelizable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[US1]**: Belongs to User Story 1 — Record and Copy a File Path

---

## Phase 1: Setup (Schema + Migration)

**Purpose**: Add the `filePath` column to the database. Must complete before any code change,
because the Prisma client is regenerated here and all subsequent TypeScript imports depend on it.

- [ ] T001 Add `filePath String?` to the `Waypoint` model in `prisma/schema.prisma` (after the `notes` field)
- [ ] T002 Run `npx prisma migrate dev --name add-waypoint-filepath` to create the migration and regenerate the Prisma client in `app/generated/prisma/`

---

## Phase 2: Foundational (Type + Mapper)

**Purpose**: Update the shared TypeScript type and the DB→AppState mapper. All UI and API
tasks depend on these two files being updated first.

**⚠️ CRITICAL**: UI and API tasks cannot be completed correctly until T003 and T004 are done.

- [ ] T003 [P] Add `filePath?: string` to the `Waypoint` interface in `app/lib/types.ts` (after the `notes?: string` field)
- [ ] T004 [P] Add `filePath: row.filePath ?? undefined` to `toWaypoint()` in `app/lib/db-mappers.ts` (after the `notes` line)

**Checkpoint**: Foundation ready — all remaining tasks can proceed in parallel.

---

## Phase 3: User Story 1 — Record and Copy a File Path (Priority: P1) 🎯 MVP

**Goal**: Users can enter a file path on any waypoint, see it in the detail panel, and click
it to copy it to the clipboard with a 2-second "Copied!" confirmation.

**Independent Test**: Create a waypoint with `filePath = "src/components/ShrimpApp.tsx"`,
save, select the waypoint, click the path in the detail panel, verify clipboard contains the
path and "Copied!" appears briefly.

### API routes (T005–T006 are parallel — different files)

- [ ] T005 [P] [US1] In `app/api/waypoints/route.ts`: add `filePath: body.filePath ?? null` to the `prisma.waypoint.create` data object (after `notes`)
- [ ] T006 [P] [US1] In `app/api/waypoints/[id]/route.ts`: add `...(body.filePath !== undefined && { filePath: body.filePath || null })` to the conditional update spread in the `PUT` handler

### UI components (T007–T008 are parallel — different files)

- [ ] T007 [P] [US1] In `app/components/WaypointForm.tsx`: add `filePath` to local form state (init: `initialValues?.filePath ?? ''`); add an optional "File Path" text input after the Notes field (placeholder: "e.g. src/components/MyComponent.tsx"); pass `filePath: filePath.trim() || undefined` in the `onSave` call
- [ ] T008 [P] [US1] In `app/components/WaypointDetail.tsx`: add `const [copied, setCopied] = useState(false)`; below the notes section, conditionally render a "File Path" row when `waypoint.filePath` is truthy — show the path in monospace text; on click call `navigator.clipboard.writeText(waypoint.filePath).catch(() => {})`, `setCopied(true)`, and `setTimeout(() => setCopied(false), 2000)`; show "Copied!" in place of the copy hint while `copied` is true

**Checkpoint**: US1 fully functional — all four acceptance scenarios from spec.md should pass.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [ ] T009 Manually verify all four acceptance scenarios from spec.md: (1) enter path → save → visible in detail; (2) click path → clipboard contains path, "Copied!" appears and disappears; (3) waypoint with no path → no path section shown; (4) reload → path still present

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** (T001 → T002): Sequential — migration depends on schema change
- **Phase 2** (T003, T004): Both depend on T002 (Prisma client regenerated); T003 and T004 are parallel with each other
- **Phase 3** (T005–T008): All depend on T003 + T004; all four are parallel with each other (different files)
- **Phase 4** (T009): Depends on all Phase 3 tasks

### Parallel Opportunities

```
Phase 2 (after T002):
  Task: "Add filePath to types.ts (T003)"
  Task: "Add filePath to db-mappers.ts (T004)"

Phase 3 (after T003 + T004):
  Task: "Update POST /api/waypoints (T005)"
  Task: "Update PUT /api/waypoints/[id] (T006)"
  Task: "Update WaypointForm (T007)"
  Task: "Update WaypointDetail (T008)"
```

---

## Implementation Strategy

### MVP (the only user story)

1. T001 → T002: Schema + migration (sequential)
2. T003 + T004: Type + mapper (parallel)
3. T005–T008: API + UI (all parallel)
4. T009: Manual verification

### Incremental Validation Points

- After T002: `npx tsc --noEmit` should still pass (no app changes yet)
- After T003 + T004: `npx tsc --noEmit` should still pass
- After T005 + T006: API routes handle `filePath` correctly
- After T007: Form saves `filePath` to DB
- After T008: Detail panel displays and copies `filePath`

---

## Notes

- [P] tasks = different files, safe to run in parallel
- T002 regenerates the Prisma client (`app/generated/prisma/`) — do not start T003/T004 until it completes
- The `filePath` field in Prisma is `String?` (nullable); in TypeScript it is `string | undefined`; `toWaypoint()` converts between them with `?? undefined`
- Empty string from the form is treated as absent: `filePath.trim() || undefined`
- The Clipboard API call in T008 must silently swallow errors per spec (`.catch(() => {})`)
