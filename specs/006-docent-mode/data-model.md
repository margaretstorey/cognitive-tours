# Data Model: Docent Mode — Per-Step Tour Narrative

## Prisma Schema Change

File: `prisma/schema.prisma`

```prisma
model TourWaypoint {
  tourId     String
  waypointId String
  order      Int
  narrative  String?        // NEW — optional per-stop narrative text
  tour       Tour   @relation(fields: [tourId], references: [id], onDelete: Cascade)

  @@id([tourId, order])
  @@index([tourId])
}
```

**Migration command (local dev)**:
```
npx prisma db push
```

**Migration command (Turso/production)** — run with production env vars:
```
TURSO_DATABASE_URL=<url> TURSO_AUTH_TOKEN=<token> npx prisma db push
```

Existing `TourWaypoint` rows will receive `narrative = NULL`. No data loss.

---

## TypeScript Type Changes

File: `app/lib/types.ts`

### New type

```typescript
export interface TourStop {
  waypointId: string;
  narrative?: string;
}
```

### Changed type

```typescript
// BEFORE
export interface Tour {
  id: string;
  name: string;
  description: string;
  waypointIds: string[];
}

// AFTER
export interface Tour {
  id: string;
  name: string;
  description: string;
  stops: TourStop[];
}
```

---

## Mapper Change

File: `app/lib/db-mappers.ts`

```typescript
// BEFORE
export function toTour(row: DbTour & { waypoints: DbTourWaypoint[] }): Tour {
  const sorted = [...row.waypoints].sort((a, b) => a.order - b.order);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    waypointIds: sorted.map(tw => tw.waypointId),
  };
}

// AFTER
export function toTour(row: DbTour & { waypoints: DbTourWaypoint[] }): Tour {
  const sorted = [...row.waypoints].sort((a, b) => a.order - b.order);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    stops: sorted.map(tw => ({
      waypointId: tw.waypointId,
      ...(tw.narrative ? { narrative: tw.narrative } : {}),
    })),
  };
}
```

---

## Entity Summary

| Entity | Field | Type | Nullable | Notes |
|--------|-------|------|----------|-------|
| TourWaypoint | narrative | String | Yes | New field. Null = no narrative for this stop |
| Tour (TypeScript) | stops | TourStop[] | No | Replaces waypointIds |
| TourStop (TypeScript) | waypointId | string | No | Was the element of waypointIds |
| TourStop (TypeScript) | narrative | string | Yes | Optional; undefined = no narrative |

---

## Validation Rules

- Empty string saved in `narrative` is treated as null before persisting (normalized in API handler).
- `narrative` exceeding reasonable display length (~2000 chars) is accepted without truncation — the display area scrolls.
- `stops` array may be empty (a tour with no waypoints is allowed, as it is today).
- Order of `stops` is authoritative — it maps directly to `TourWaypoint.order`.
