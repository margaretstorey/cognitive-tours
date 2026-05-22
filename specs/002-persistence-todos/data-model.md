# Data Model: Phase 2 — Persistence

**Feature**: `002-persistence-todos` | **Date**: 2026-05-21

## AppState types (unchanged from Phase 1)

The TypeScript types in `app/lib/types.ts` are unchanged. Persistence is transparent to the
component layer — components still receive and mutate the same `Waypoint`, `WaypointEdge`, and
`Tour` shapes they used in Phase 1.

```ts
// app/lib/types.ts (no changes required)
export type WaypointType =
  | 'User Need'
  | 'Feature'
  | 'ADR'
  | 'Code Component'
  | 'Test'
  | 'Risk'
  | 'AI Instruction'
  | 'Open Question';

export interface Waypoint {
  id: string;
  label: string;
  type: WaypointType;
  description: string;
  notes?: string;
  position: { x: number; y: number };
}

export interface WaypointEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  waypointIds: string[];
}
```

## ShrimpApp state additions

`ShrimpApp.tsx` gains two new local state variables (not part of the shared `AppState` type
since they are lifecycle/transient concerns):

```ts
// Inside ShrimpApp:
type LoadState = 'loading' | 'ready' | 'error';

const [loadState, setLoadState] = useState<LoadState>('loading');
const [errorMessage, setErrorMessage] = useState<string | null>(null);
```

## Prisma schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Waypoint {
  id          String  @id
  label       String
  type        String
  description String
  notes       String?
  posX        Float
  posY        Float
}

model Edge {
  id     String  @id
  source String
  target String
  label  String?
}

model Tour {
  id          String         @id
  name        String
  description String
  waypoints   TourWaypoint[]
}

model TourWaypoint {
  tourId     String
  waypointId String
  order      Int
  tour       Tour   @relation(fields: [tourId], references: [id], onDelete: Cascade)

  @@id([tourId, order])
  @@index([tourId])
}
```

**Notes**:
- `Waypoint.type` is stored as a plain `String`. The `WaypointType` union is enforced at the
  TypeScript layer by the `db-mappers.ts` mapping function.
- `Waypoint.posX` / `posY` store the React Flow node position. This satisfies the assumption
  that graph layout survives a reload.
- `TourWaypoint.order` is the array index (0-based). When reading tours, rows are sorted by
  `order` to reconstruct `waypointIds`.
- `onDelete: Cascade` on `TourWaypoint` means deleting a `Tour` row automatically removes its
  `TourWaypoint` rows. Waypoint deletion cascading from tours is handled in application code
  (same as Phase 1).

## Mapping functions (`app/lib/db-mappers.ts`)

These pure functions convert between Prisma model shapes and AppState types:

```ts
import type { Waypoint as PrismaWaypoint, Edge as PrismaEdge, Tour as PrismaTour, TourWaypoint } from '@prisma/client';
import type { Waypoint, WaypointEdge, Tour, WaypointType } from './types';

export function toWaypoint(row: PrismaWaypoint): Waypoint {
  return {
    id: row.id,
    label: row.label,
    type: row.type as WaypointType,
    description: row.description,
    notes: row.notes ?? undefined,
    position: { x: row.posX, y: row.posY },
  };
}

export function toEdge(row: PrismaEdge): WaypointEdge {
  return {
    id: row.id,
    source: row.source,
    target: row.target,
    label: row.label ?? undefined,
  };
}

export function toTour(row: PrismaTour & { waypoints: TourWaypoint[] }): Tour {
  const sorted = [...row.waypoints].sort((a, b) => a.order - b.order);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    waypointIds: sorted.map(tw => tw.waypointId),
  };
}
```

## Startup data loading shape

`GET /api/data` returns:

```ts
interface BulkDataResponse {
  waypoints: Waypoint[];
  edges: WaypointEdge[];
  tours: Tour[];
}
```

This is the only shape `ShrimpApp` reads from the API on startup.

## Environment variable

`DATABASE_URL` is required by Prisma. For local development, add to `.env`:

```
DATABASE_URL="file:./prisma/dev.db"
```

This file must not be committed (add to `.gitignore` if not already present). The path is
relative to the project root when run via `next dev`.
