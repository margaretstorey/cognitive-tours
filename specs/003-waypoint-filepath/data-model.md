# Data Model: Waypoint File Path

**Feature**: `003-waypoint-filepath` | **Date**: 2026-05-22

## TypeScript type change (`app/lib/types.ts`)

One field added to the existing `Waypoint` interface:

```ts
export interface Waypoint {
  id: string;
  label: string;
  type: WaypointType;
  description: string;
  notes?: string;
  filePath?: string;      // ← new, optional
  position: { x: number; y: number };
}
```

All other types (`WaypointEdge`, `Tour`, `AppState`) are unchanged.

## Prisma schema change (`prisma/schema.prisma`)

One field added to the existing `Waypoint` model:

```prisma
model Waypoint {
  id          String  @id
  label       String
  type        String
  description String
  notes       String?
  filePath    String?   // ← new
  posX        Float
  posY        Float
}
```

## Migration

Running `npx prisma migrate dev --name add-waypoint-filepath` generates:

```sql
-- AlterTable
ALTER TABLE "Waypoint" ADD COLUMN "filePath" TEXT;
```

Existing rows receive `NULL` for `filePath`, which maps to `undefined` in TypeScript.

## db-mappers.ts change (`app/lib/db-mappers.ts`)

`toWaypoint()` gains one line:

```ts
export function toWaypoint(row: DbWaypoint): Waypoint {
  return {
    id: row.id,
    label: row.label,
    type: row.type as WaypointType,
    description: row.description,
    notes: row.notes ?? undefined,
    filePath: row.filePath ?? undefined,   // ← new
    position: { x: row.posX, y: row.posY },
  };
}
```

## WaypointForm local state change

The form's local state gains `filePath: string` (initialized to `''`):

```ts
// Inside WaypointForm, existing state shape gains one field:
const [filePath, setFilePath] = useState(initialValues?.filePath ?? '');

// On save, passed as:
filePath: filePath.trim() || undefined
```

## WaypointDetail local state addition

A `copied` boolean is added to track the clipboard confirmation:

```ts
const [copied, setCopied] = useState(false);
```

This state lives inside `WaypointDetail` and is entirely local — no prop or handler change
needed in `ShrimpApp`.
