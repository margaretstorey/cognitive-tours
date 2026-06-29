# UI Contracts: Tour Markdown View

## New utility: app/lib/tour-markdown.ts

```ts
export function tourSlug(name: string): string
// Input:  "Triple Debt Tour"
// Output: "triple-debt-tour"
// Rules: lowercase, replace non-alphanumeric runs with '-', trim leading/trailing '-'

export function generateTourMarkdown(tour: Tour, waypoints: Waypoint[]): string
// Returns a complete markdown string for the tour.
// Format:
//   # <tour.name>
//   <tour.description>              (omitted if empty)
//
//   ---
//
//   ## Stop 1: <waypoint.label>    (one section per stop, in sequence order)
//   <waypoint.description>          (omitted if empty)
//
//   <waypoint.notes>                (omitted if absent)
//
//   `<waypoint.filePath>`           (omitted if absent)
//
//   > <stop.narrative>              (blockquote, omitted if absent)
```

## New component: app/components/TourMarkdownView.tsx

```ts
interface TourMarkdownViewProps {
  tour: Tour;
  waypoints: Waypoint[];
}

export default function TourMarkdownView({ tour, waypoints }: TourMarkdownViewProps): JSX.Element
// Read-only. No callbacks. Renders tour as styled prose JSX.
// Scrollable. Replaces WaypointGraph in the left panel.
```

## Modified: TourBar props (additions only)

```ts
// New props added to TourBarProps:
markdownViewOpen: boolean;
onToggleMarkdownView: () => void;
// All existing props unchanged.
```

Toggle button behaviour:
- Only rendered when `activeTourId !== null`
- Visual state: active/pressed when `markdownViewOpen === true`
- Label: "Markdown" (active) / "Graph" (inactive) — or a single toggle label, designer's choice

Export button behaviour:
- Only rendered when `activeTourId !== null`
- Label: "Export ↓"
- On click: generates markdown string, triggers `<a download="...">` browser download
- No callback to parent required — all needed data is in TourBar props

## Modified: CognitiveToursApp state additions

```ts
const [markdownViewOpen, setMarkdownViewOpen] = useState(false);
// Reset to false inside selectTour() when id changes.

const onToggleMarkdownView = useCallback(
  () => setMarkdownViewOpen(v => !v),
  []
);
```

Left panel render:
```tsx
{markdownViewOpen && activeTour
  ? <TourMarkdownView tour={activeTour} waypoints={waypoints} />
  : <WaypointGraph … />
}
```
