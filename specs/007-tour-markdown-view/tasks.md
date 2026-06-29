# Tasks: Tour Markdown View

**Input**: Design documents from `specs/007-tour-markdown-view/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ui-contracts.md ✅

**Tests**: Not requested — no test tasks included.

**Organization**: 2 user stories (US1: toggle view, US2: export). No schema changes, no new API routes, no new packages. 4 files touched total.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[US1]**: Toggle Markdown View (spec P1)
- **[US2]**: Export Tour as Browser Download (spec P2)

---

## Phase 1: Setup

**No setup required.** No new packages, no schema migrations, no new API routes. Proceed directly to foundational.

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: Pure utility that US2 (export) depends on. Can be written and verified independently before any UI work.

**⚠️ CRITICAL**: T001 must be complete before T005 (export button).

- [ ] T001 Create `app/lib/tour-markdown.ts` with two exported functions: `tourSlug(name: string): string` (lowercase, hyphens, strip non-alphanumeric) and `generateTourMarkdown(tour: Tour, waypoints: Waypoint[]): string` (produces the full markdown export string: H1 tour name, description paragraph, then per-stop sections with waypoint label as H2 heading, description, notes if present, filePath as inline code if present, narrative as blockquote if present)

**Checkpoint**: `tourSlug` and `generateTourMarkdown` are importable and return correct output for a sample tour.

---

## Phase 3: User Story 1 — Toggle Markdown View (Priority: P1) 🎯 MVP

**Goal**: User can click a toggle in the tour bar to replace the graph panel with a styled, read-only prose rendering of the active tour's waypoints in sequence.

**Independent Test**: Select any tour, click the "Markdown" toggle — the React Flow graph disappears and is replaced by the tour rendered as formatted text. Toggle back — the graph returns. No page reload. Verify with a tour that has docent narratives (amber bar text) to confirm narrative appears in the view.

### Implementation

- [ ] T002 [P] [US1] Create `app/components/TourMarkdownView.tsx` — read-only client component with props `{ tour: Tour; waypoints: Waypoint[] }`. Renders: tour name as `<h1>`, tour description as a paragraph, then for each stop in `tour.stops` order: waypoint label as `<h2>`, description as `<p>`, notes as `<p>` (omit if absent), filePath as `<code>` (omit if absent), stop narrative as a styled aside/blockquote (omit if absent). Scrollable. No edit controls.
- [ ] T003 [P] [US1] Modify `app/components/TourBar.tsx` — add two props to `TourBarProps`: `markdownViewOpen: boolean` and `onToggleMarkdownView: () => void`. Add a toggle button in the tour bar (only rendered when `activeTourId !== null`) that calls `onToggleMarkdownView` on click. Button label or style must reflect active state when `markdownViewOpen` is `true`.
- [ ] T004 [US1] Modify `app/components/CognitiveToursApp.tsx` — (a) add `const [markdownViewOpen, setMarkdownViewOpen] = useState(false)`, (b) inside the existing `selectTour` callback, reset `setMarkdownViewOpen(false)` when `id` changes, (c) add `const onToggleMarkdownView = useCallback(() => setMarkdownViewOpen(v => !v), [])`, (d) pass `markdownViewOpen` and `onToggleMarkdownView` to `<TourBar>`, (e) in the left panel, conditionally render `<TourMarkdownView tour={activeTour} waypoints={waypoints} />` when `markdownViewOpen && activeTour !== null`, otherwise render the existing `<WaypointGraph>` unchanged. Depends on T002 and T003.

**Checkpoint**: Toggle works. Graph view and markdown view swap cleanly. Deselecting a tour resets to graph view.

---

## Phase 4: User Story 2 — Export Tour as Browser Download (Priority: P2)

**Goal**: User can click an Export button in the tour bar to download the active tour as a dated `.md` file. No server write. User manually places the file in `tours/` and commits it.

**Independent Test**: Select any tour, click Export. Browser downloads a file named `<tour-slug>-<YYYY-MM-DD>.md`. Open it — verify it contains the tour name, description, and each waypoint section in order. Verify Vercel production deployment is unaffected (no filesystem writes).

### Implementation

- [ ] T005 [US2] Modify `app/components/TourBar.tsx` — add an "Export ↓" button (only rendered when `activeTourId !== null`). On click: (a) look up the active tour from the `tours` prop using `activeTourId`, (b) import and call `generateTourMarkdown(tour, waypoints)` from `app/lib/tour-markdown`, (c) import and call `tourSlug(tour.name)` to build the filename `${tourSlug(tour.name)}-${new Date().toISOString().slice(0, 10)}.md`, (d) create a `Blob` with type `'text/markdown'`, (e) create an object URL, (f) programmatically create and click a hidden `<a download="…">` element, (g) call `URL.revokeObjectURL` after click. Depends on T001 and T003.

**Checkpoint**: Download triggers. File opens correctly in a markdown viewer. Filename includes today's date.

---

## Phase 5: Polish & Verification

- [ ] T006 Manual browser verification — run the dev server, open the app, verify both features end-to-end: (a) toggle works on a tour with and without docent narratives, (b) toggling back restores graph, (c) switching tours resets to graph view, (d) export downloads a valid `.md` file with correct name and content, (e) confirm no TypeScript errors (`tsc --noEmit`).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: No dependencies — start immediately
- **Phase 3 (US1)**: T002 and T003 are parallel and can start immediately (no dependency on T001). T004 depends on T002 + T003.
- **Phase 4 (US2)**: T005 depends on T001 (for `generateTourMarkdown`) and T003 (TourBar already has the new props structure). Can start once T001 and T003 are both done.
- **Phase 5 (Polish)**: Depends on T004 and T005.

### User Story Dependencies

- **US1 (P1)**: Independent — no dependency on US2
- **US2 (P2)**: Depends on T001 (foundational) and T003 (TourBar props exist). Can start as soon as those are done, even before T004 is complete.

### Parallel Opportunities

- T001, T002, T003 can all run in parallel (three different files)
- T004 and T005 can run in parallel once T001 + T002 + T003 are done

---

## Parallel Example: US1 + US2 together

```
# Start these three in parallel:
T001 — app/lib/tour-markdown.ts
T002 — app/components/TourMarkdownView.tsx
T003 — app/components/TourBar.tsx (toggle props + button)

# Once T002 + T003 done:
T004 — app/components/CognitiveToursApp.tsx (US1 wiring)

# Once T001 + T003 done:
T005 — app/components/TourBar.tsx (export button)

# Once T004 + T005 done:
T006 — Manual verification
```

---

## Implementation Strategy

### MVP (US1 only — 3 tasks)

1. T001 — utility (also needed by US2, worth doing first)
2. T002 + T003 in parallel
3. T004 — wiring
4. **Validate**: toggle works in browser
5. Stop — US2 can follow independently

### Full Feature (US1 + US2 — 5 tasks + verification)

1. T001 + T002 + T003 in parallel
2. T004 + T005 in parallel
3. T006 — verify both
