# UI Contracts: Waypoint File Path

**Feature**: `003-waypoint-filepath` | **Date**: 2026-05-22

---

## WaypointForm (`app/components/WaypointForm.tsx`)

### Props — unchanged

No prop changes. The form already receives `initialValues?: Waypoint` and calls
`onSave(data: Omit<Waypoint, 'id' | 'position'>)`.

### New form field

A "File Path" text input is added after the existing "Notes" field:

```
Label:       File Path
Input type:  text
Placeholder: "e.g. src/components/MyComponent.tsx"
Required:    No
Initial:     initialValues?.filePath ?? ''
On change:   updates local filePath state
```

### Updated save data

`onSave` is called with `filePath` included:

```ts
onSave({
  label,
  type,
  description,
  notes: notes.trim() || undefined,
  filePath: filePath.trim() || undefined,   // empty → undefined (absent)
})
```

---

## WaypointDetail (`app/components/WaypointDetail.tsx`)

### Props — unchanged

No prop changes. `waypoint: Waypoint | null` already carries `filePath`.

### New conditional section

Below the existing notes display, when `waypoint.filePath` is truthy:

```
Label row:   "File Path"
Content:     waypoint.filePath displayed in monospace text
Interaction: clicking the path text triggers clipboard copy
Feedback:    "Copied!" label appears for ~2 seconds, then disappears
```

### Behaviour contract

```
State:      copied: boolean (local, initialized false)

On click:
  1. navigator.clipboard.writeText(waypoint.filePath).catch(() => {})
  2. setCopied(true)
  3. setTimeout(() => setCopied(false), 2000)

Render:
  - When copied === false: show path text + copy hint (e.g. cursor-pointer styling)
  - When copied === true:  show "Copied!" in place of or alongside the path
```

### Absence behaviour

When `waypoint.filePath` is falsy (undefined, empty, or null), no file path section is rendered
at all — not even an empty row.

---

## API route changes (no new endpoints)

### POST /api/waypoints (`app/api/waypoints/route.ts`)

```ts
// Add to prisma.waypoint.create data:
filePath: body.filePath ?? null,
```

### PUT /api/waypoints/[id] (`app/api/waypoints/[id]/route.ts`)

```ts
// Add to conditional update spread:
...(body.filePath !== undefined && { filePath: body.filePath || null }),
```

Both changes are additive. No other route changes are needed.
