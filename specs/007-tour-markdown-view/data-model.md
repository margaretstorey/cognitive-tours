# Data Model: Tour Markdown View

No schema changes. All data is read from existing in-memory state.

## Entities used (read-only)

### Tour
```
id: string
name: string           → H1 heading; slug for export filename
description: string    → intro paragraph in view and export
stops: TourStop[]      → ordered sequence of waypoint stops
```

### TourStop
```
waypointId: string     → key to look up Waypoint
narrative?: string     → docent transition text (rendered after waypoint body)
```

### Waypoint
```
id: string
label: string          → section heading per stop
type: WaypointType     → displayed as a badge/label (optional decoration)
description: string    → primary body text per stop
notes?: string         → supplementary body text (rendered if present)
filePath?: string      → code reference (rendered as monospace if present)
```

## Derived values

| Value | Derivation |
|-------|-----------|
| Export filename | `tourSlug(tour.name) + '-' + YYYY-MM-DD + '.md'` |
| YYYY-MM-DD | `new Date().toISOString().slice(0, 10)` at moment of export |
| Tour slug | `tour.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')` |

## Invariants

- Markdown is generated on demand from in-memory state — never read from or written to the database
- `TourStop.narrative` is the docent field (lives on the join record, not the Waypoint)
- Waypoints with no `description`, `notes`, or `filePath` render only the heading — no empty blocks
