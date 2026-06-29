# Research: Tour Markdown View

## Q1: Should we add a markdown renderer library?

**Decision**: No.

**Rationale**: We own the data structure. Rendering tour content as styled JSX directly from `Tour` + `Waypoint` objects is simpler, faster, and requires no new dependency. The markdown string (`generateTourMarkdown`) is needed only for the browser file download — it is never rendered via a parser.

**Alternatives considered**: `react-markdown`, `marked`. Both rejected — YAGNI (Constitution I).

---

## Q2: Where should toggle state live?

**Decision**: `markdownViewOpen` state lives in `CognitiveToursApp`.

**Rationale**: The toggle controls which component occupies the left panel. That layout decision belongs in the parent that owns the panel structure. `TourBar` receives the state as a prop and the setter as a callback — same pattern used throughout the existing codebase.

---

## Q3: Should the Export button callback lift up to the parent?

**Decision**: No — Export is handled entirely within `TourBar`.

**Rationale**: `TourBar` already receives `tours`, `activeTourId`, and `waypoints`. All data needed to generate the markdown string and trigger the download is in scope. A lift-up would add indirection with no benefit.

**Browser download pattern** (no library needed):
```ts
const blob = new Blob([markdown], { type: 'text/markdown' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = filename;
a.click();
URL.revokeObjectURL(url);
```

---

## Q4: How should markdownViewOpen behave when tour changes?

**Decision**: Reset to `false` whenever `selectTour` is called (including deselection).

**Rationale**: Prevents stale markdown view when switching tours mid-session. Simple reset inside the existing `selectTour` callback with no extra coordination needed.
