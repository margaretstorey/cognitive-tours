# Implementation Plan: Waypoint File Path

**Branch**: `003-waypoint-filepath` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-waypoint-filepath/spec.md`

## Summary

Add an optional `filePath` field to `Waypoint`. The field is stored as a nullable string in
SQLite, added to the TypeScript type, surfaced as a plain text input in the create/edit form,
and displayed in the detail panel as a clickable element that copies the path to the clipboard
with a brief "Copied!" confirmation. All existing API routes are updated to pass the field
through. No new routes are introduced.

## Technical Context

**Language/Version**: TypeScript 5 (strict: true), React 19.2.4

**Primary Dependencies**: Next.js 16.2.6 (App Router), Prisma 7.8.0 + @prisma/adapter-better-sqlite3, SQLite, Tailwind CSS 4

**Storage**: Existing SQLite database via Prisma; one new nullable column added via migration

**Testing**: Not in scope

**Target Platform**: Desktop browser (Clipboard API available in all modern browsers)

**Project Type**: Additive change to existing web application

**Performance Goals**: None beyond existing app targets; clipboard copy is instantaneous

**Constraints**: strict TypeScript; `filePath` is always optional; no path validation; no file browser

**Scale/Scope**: Single new field across ~5 files; one new Prisma migration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Simplicity**: One nullable column, one optional TypeScript field, one form input, one
  display element with built-in browser Clipboard API. No new abstraction layers.
- [x] **II. Incremental Growth**: Each file change leaves the app runnable (schema → type →
  mapper → form → detail → API). Changes are independently verifiable at each step.
- [x] **III. Intent Before Implementation**: Spec is complete with acceptance scenarios,
  edge cases, and clipboard fallback behaviour.
- [x] **IV. Clean TypeScript**: `filePath?: string` is a clean optional; the Clipboard API
  returns a `Promise<void>`; no `any` needed.
- [x] **V. Minimal UI**: Adds exactly one text input in the form and one conditionally rendered
  clickable element in the detail panel. Both serve a named functional requirement.
- [x] **VI. Universal Waypoints & Tours**: `filePath` is available on all waypoint types;
  no type-specific behaviour.
- [x] **VII. Flexible Navigation**: The field is optional and works equally for code-linked and
  intent-only waypoints; no mode is privileged.
- [x] **VIII. Human and Agent Readable**: The field stores a plain path string; no opaque
  identifiers; the label "File Path" is self-describing.

All gates pass. ✅

## Project Structure

### Documentation (this feature)

```text
specs/003-waypoint-filepath/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/
│   └── ui-contracts.md  # Component change contracts
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code changes (repository root)

```text
prisma/
└── schema.prisma               # Add filePath String? to Waypoint model
    migrations/
    └── YYYYMMDD_add_waypoint_filepath/
        └── migration.sql       # ALTER TABLE Waypoint ADD COLUMN filePath TEXT

app/
├── lib/
│   ├── types.ts                # Add filePath?: string to Waypoint interface
│   └── db-mappers.ts           # Add filePath to toWaypoint() mapping
├── components/
│   ├── WaypointForm.tsx        # Add "File Path" optional text input + form state
│   └── WaypointDetail.tsx      # Add conditional file path display with copy + "Copied!"
└── api/
    └── waypoints/
        ├── route.ts            # Include filePath in prisma.waypoint.create data
        └── [id]/route.ts       # Include filePath in prisma.waypoint.update data
```

**Structure Decision**: No new files are created. All changes are additive within existing files.

## Complexity Tracking

No constitution violations. No complexity justification required.

## Implementation Notes

### Prisma schema change

Add `filePath String?` to the existing `Waypoint` model. SQLite stores this as a nullable `TEXT`
column. The migration adds the column with `DEFAULT NULL`, so existing rows are unaffected.

### TypeScript Waypoint type

`filePath?: string` is added to the existing `Waypoint` interface in `app/lib/types.ts`.
Existing code that destructures or spreads `Waypoint` objects is unaffected — the field is optional.

### db-mappers.ts

`toWaypoint()` gains `filePath: row.filePath ?? undefined` — converts Prisma's `string | null`
to TypeScript's `string | undefined`.

### WaypointForm changes

`filePath` is added to the form's local state (initialized to `''`). A new optional text input
labelled "File Path" is rendered after the existing "Notes" field. When the form saves,
`filePath` is passed as `filePath: value.trim() || undefined` (empty string treated as absent
per spec assumption).

### WaypointDetail changes

Below the existing notes display, conditionally render a "File Path" row only when
`waypoint.filePath` is truthy. The row contains a label ("File Path") and the path in monospace
text. Clicking the path text triggers clipboard copy. A local `copied: boolean` state drives the
"Copied!" label. On click:

1. `navigator.clipboard.writeText(waypoint.filePath)` — async, errors silently swallowed
2. `setCopied(true)`
3. `setTimeout(() => setCopied(false), 2000)`

### API routes — no structural changes

- `POST /api/waypoints`: add `filePath: body.filePath ?? null` to `prisma.waypoint.create` data
- `PUT /api/waypoints/[id]`: add `filePath` to the conditional update spread —
  `...(body.filePath !== undefined && { filePath: body.filePath || null })`

`GET /api/data` uses `toWaypoint()` which picks up the new field automatically after the mapper
is updated.

### ShrimpApp.tsx — no changes needed

`updateWaypoint` already accepts `Partial<Omit<Waypoint, 'id'>>` and forwards the full partial
object to the API. `filePath` flows through automatically.
