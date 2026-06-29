# Implementation Plan: Tour Markdown View

**Branch**: `007-tour-markdown-view` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-tour-markdown-view/spec.md`

## Summary

When a tour is active, the user can toggle the left panel from the React Flow graph to a live-rendered markdown view of the tour (waypoint sequence with docent narratives). A separate Export button in the tour bar triggers a browser file download of the tour as a dated `.md` snapshot. No new API routes are needed — all data is already available client-side from existing props.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Next.js App Router, React 18, Tailwind CSS — no new packages required

**Storage**: N/A for this feature — markdown is generated on the fly from in-memory state, never persisted

**Testing**: Manual browser verification (Playwright not yet installed per CLAUDE.md)

**Target Platform**: Web browser (same as existing app); Vercel deployment with read-only filesystem — export uses browser Blob download, not server write

**Project Type**: Web application (Next.js client components)

**Performance Goals**: Markdown view renders a 10-waypoint tour in under 1 second (trivially met — pure in-memory transform)

**Constraints**: Markdown must never be stored in the DB; export must not write to server filesystem; toggle only active when a tour is selected

**Scale/Scope**: Single user, handful of tours with up to ~20 waypoints each

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Simplicity**: No new dependencies, no new API routes. Two new files (utility + component), two modified files.
- [x] **II. Incremental Growth**: Two independently deliverable slices — (1) toggle + markdown view, (2) export button. Each leaves the app fully runnable.
- [x] **III. Intent Before Implementation**: Spec complete with user stories and acceptance criteria.
- [x] **IV. Clean TypeScript**: All new code typed strictly; no `any`; pure utility functions with explicit return types.
- [x] **V. Minimal UI**: Two buttons added to an existing bar. Markdown view is read-only prose — no decorative elements.
- [x] **VI. Universal Waypoints & Tours**: Feature is domain-agnostic — renders any tour, any waypoint type.
- [x] **VII. Flexible Navigation**: Markdown view works equally for code-linked and intent-only waypoints. `filePath` is rendered only if present.
- [x] **VIII. Human and Agent Readable**: The rendered view surfaces waypoint label, description, notes, and narrative — all human-readable fields already in the data model.

No violations. No Complexity Tracking required.

## Project Structure

### Documentation (this feature)

```text
specs/007-tour-markdown-view/
├── plan.md              ← this file
├── research.md          ← Phase 0 (below)
├── data-model.md        ← Phase 1 (below)
└── tasks.md             ← Phase 2 output (/speckit-tasks — not created here)
```

### Source Code

```text
app/
  lib/
    tour-markdown.ts      ← NEW: generateTourMarkdown(), tourSlug()
  components/
    TourMarkdownView.tsx  ← NEW: read-only tour prose view
    TourBar.tsx           ← MODIFIED: add toggle button + export button + 2 new props
    CognitiveToursApp.tsx ← MODIFIED: add markdownViewOpen state, conditional panel render
```

No new API routes. No schema changes. No new packages.

---

## Phase 0: Research

### Decision: No markdown renderer library needed

**Decision**: Render `TourMarkdownView` as styled JSX directly from tour data. Use `generateTourMarkdown()` only for the export string (Blob download).

**Rationale**: Adding `react-markdown` or similar would violate Constitution I (YAGNI). We control the data format — rendering as JSX is simpler and avoids a parse/render round-trip. The export needs a string anyway, so the utility function is the right place for that.

**Alternatives considered**: `react-markdown` (no new dep needed), `marked` (same). Both rejected — unnecessary for structured data we own.

### Decision: Toggle state lives in CognitiveToursApp

**Decision**: `markdownViewOpen: boolean` state lives in `CognitiveToursApp`, not `TourBar`. `TourBar` receives `markdownViewOpen` prop and `onToggleMarkdownView` callback.

**Rationale**: The toggle controls which component occupies the left panel — that rendering decision belongs in the parent that owns the layout. `TourBar` is a control strip; it should not own panel visibility.

**Alternatives considered**: Local state in `TourBar` with an `onMarkdownViewChange` lift-up — rejected because `CognitiveToursApp` needs to know the state to switch the panel.

### Decision: Export button lives in TourBar, handles download internally

**Decision**: The Export button lives in `TourBar`. It calls `generateTourMarkdown()` and triggers a browser Blob download directly, without a callback to the parent.

**Rationale**: `TourBar` already has `tours`, `activeTourId`, and `waypoints` as props — all data needed for export. No state needs to move. A callback to the parent would be indirection with no benefit.

### Decision: markdownViewOpen resets to false when tour changes

**Decision**: When the user selects a different tour (or deselects), `markdownViewOpen` resets to `false`.

**Rationale**: Prevents stale markdown view showing content from a previous tour when switching.

---

## Phase 1: Design & Contracts

### Data model

No schema changes. All required data is already in memory:

| Source | Used for |
|--------|----------|
| `Tour.name` | H1 heading in view and export filename slug |
| `Tour.description` | Subtitle/intro paragraph |
| `Tour.stops[]` | Ordered waypoint sequence |
| `TourStop.waypointId` | Lookup key into `waypoints` array |
| `TourStop.narrative` | Docent transition text (already in `TourStop` type) |
| `Waypoint.label` | Section heading per stop |
| `Waypoint.description` | Body text per stop |
| `Waypoint.notes` | Optional supplementary text per stop |
| `Waypoint.filePath` | Optional code reference per stop |

See `data-model.md` for full entity details.

### Interface contracts

No new API endpoints. This feature is entirely client-side.

See `contracts/ui-contracts.md` for the new props added to `TourBar` and the component signature for `TourMarkdownView`.

---

## Implementation Slices

### Slice A — Markdown utility + view component (P1)

1. Create `app/lib/tour-markdown.ts` with:
   - `tourSlug(name: string): string` — lowercase, hyphens, strip non-alphanumeric
   - `generateTourMarkdown(tour: Tour, waypoints: Waypoint[]): string` — produces the export string

2. Create `app/components/TourMarkdownView.tsx`:
   - Props: `{ tour: Tour; waypoints: Waypoint[] }`
   - Renders tour as formatted prose JSX (H1 name, description, numbered stops with heading/body/narrative/filePath)
   - Scrollable, read-only, Tailwind-styled

3. Modify `TourBar.tsx`:
   - Add props: `markdownViewOpen: boolean`, `onToggleMarkdownView: () => void`
   - Add "Markdown" toggle button (only visible when `activeTourId` is set)
   - Button shows active state when `markdownViewOpen` is true

4. Modify `CognitiveToursApp.tsx`:
   - Add `const [markdownViewOpen, setMarkdownViewOpen] = useState(false)`
   - Reset to `false` inside `selectTour` callback
   - Pass `markdownViewOpen` and `onToggleMarkdownView` to `TourBar`
   - In left panel: `{markdownViewOpen && activeTour ? <TourMarkdownView tour={activeTour} waypoints={waypoints} /> : <WaypointGraph … />}`

### Slice B — Export button (P2)

5. Modify `TourBar.tsx` (same file change as step 3):
   - Add "Export ↓" button (only visible when `activeTourId` is set)
   - On click: look up active tour from `tours` prop, call `generateTourMarkdown`, create `Blob`, create object URL, programmatically click a hidden `<a download="…">` element, revoke URL
   - Filename: `${tourSlug(tour.name)}-${today}.md`
