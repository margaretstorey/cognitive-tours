# Research: Docent Mode — Per-Step Tour Narrative

## Decision 1: Where does narrative live in the type system?

**Decision**: Introduce a `TourStop` interface (`{ waypointId: string; narrative?: string }`) and replace `Tour.waypointIds: string[]` with `Tour.stops: TourStop[]`.

**Rationale**: Parallel arrays (`waypointIds` + `narratives`) are fragile — an off-by-one error silently pairs the wrong narrative with the wrong stop. A typed `TourStop` object keeps waypointId and narrative co-located and self-documenting, satisfying Constitution Principle IV (clean TypeScript). Two concrete use cases exist (editor + reader), justifying the new type per Principle I.

**Alternatives considered**:
- Keep `waypointIds: string[]`, add `narratives: (string | null)[]` — rejected: parallel arrays are error-prone and harder to reason about.
- Add a `narrativeMap: Record<string, string>` on `Tour` — rejected: order-dependent data belongs on the ordered sequence, not a separate map; map key collisions arise when the same waypoint appears twice in a tour.

## Decision 2: Schema migration approach for Turso/SQLite

**Decision**: Add `narrative String?` to `TourWaypoint` in `schema.prisma` and apply via `prisma db push` (not `prisma migrate dev`). Run separately against local SQLite and against Turso.

**Rationale**: This project uses Prisma with the better-sqlite3 adapter locally and the LibSQL adapter in production (Turso). `prisma migrate dev` requires the `migrate` preview feature enabled and a migration history. The project currently uses `db push` for schema changes (no migrations directory exists). `narrative` is nullable — existing rows in both environments automatically receive NULL, so no data migration is needed.

**Alternatives considered**:
- `prisma migrate dev` — rejected: no migrations directory is established; adds complexity the project hasn't opted into.
- Manual `ALTER TABLE` — rejected: bypasses Prisma's schema source-of-truth.

For Turso: run `TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx prisma db push` with the production environment variables to push the schema change to the cloud database.

## Decision 3: API contract — backward compatibility

**Decision**: Change the API request body for POST `/api/tours` and PUT `/api/tours/[id]` to accept `stops: TourStop[]` instead of `waypointIds: string[]`. No backward-compat shim.

**Rationale**: The API has no external consumers — it is an internal client-server boundary within this single-user web app. The only callers are in `CognitiveToursApp.tsx`, which is being updated in the same PR. A clean break is simpler than maintaining both shapes (Principle I).

**Alternatives considered**:
- Accept both `waypointIds` and `stops`, merge server-side — rejected: unnecessary complexity, no external consumer to protect.

## Decision 4: Seed data migration (`mock-data.ts`)

**Decision**: Update `INITIAL_TOURS` in `mock-data.ts` to use the new `stops` shape (`{ waypointId, narrative?: string }`). Seed data runs only when the waypoints table is empty (first boot), so existing deployments are unaffected.

**Rationale**: `mock-data.ts` uses the `Tour` type directly. After the type change, compilation will fail unless the seed data is updated. Narratives for seed tours are left blank (undefined) — existing tours don't have authored narrative, and adding placeholder text would violate Principle VIII (narrative must be meaningful, not filler).

## Decision 5: Narrative display placement and conditional rendering

**Decision**: Render a `<div>` immediately below the `TourBar` `<div>` in `CognitiveToursApp.tsx`'s layout (or within `TourBar` itself, conditionally). The element is only mounted when `narrative` is truthy (non-empty string after trimming). Styling: amber/yellow highlight (`bg-amber-50 border-l-4 border-amber-400 text-sm px-4 py-2`), visually distinct but not alarming.

**Rationale**: The narrative is tour-reading UI, not navigation UI, so it should be visually subordinate to the tour bar but immediately adjacent. Conditional mounting (not conditional `display:none`) ensures no empty space is reserved when narrative is absent, satisfying FR-007 and SC-003. Amber/yellow is a conventional "annotation" colour that doesn't compete with error states (red) or primary actions (blue).

**Alternatives considered**:
- Inline below the step counter in the tour bar itself — rejected: clutters the nav bar; narrative can be long.
- Always render the container with a min-height placeholder — rejected: violates FR-007 ("no visual gap or empty box").
- A separate panel or sidebar — rejected: overkill for optional text; adds layout complexity for a single field.
