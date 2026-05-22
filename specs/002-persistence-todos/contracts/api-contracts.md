# API Contracts: Phase 2 — Persistence

**Feature**: `002-persistence-todos` | **Date**: 2026-05-21

All endpoints are Next.js Route Handlers under `app/api/`. All request and response bodies are
JSON. All mutation endpoints follow the same contract: on success return `200 OK` with the
created/updated record; on validation or not-found errors return `400` or `404`; on unexpected
errors return `500` with `{ error: string }`.

---

## GET /api/data

**Purpose**: Bulk load all persisted data on app startup. Seeds the database with mock data if
the database is empty (no waypoints exist).

**Request**: No body.

**Response** `200 OK`:
```json
{
  "waypoints": [
    {
      "id": "w01",
      "label": "Developers need mental models, not code",
      "type": "User Need",
      "description": "...",
      "notes": null,
      "position": { "x": 100, "y": 200 }
    }
  ],
  "edges": [
    { "id": "e01", "source": "w01", "target": "w02", "label": null }
  ],
  "tours": [
    {
      "id": "t01",
      "name": "New Developer Orientation",
      "description": "...",
      "waypointIds": ["w01", "w02", "w03"]
    }
  ]
}
```

**Error** `500`:
```json
{ "error": "Failed to load data" }
```

---

## POST /api/waypoints

**Purpose**: Persist a newly created waypoint.

**Request body**:
```json
{
  "id": "w-1716000000000",
  "label": "New waypoint",
  "type": "Feature",
  "description": "...",
  "notes": null,
  "position": { "x": 300, "y": 250 }
}
```

**Response** `200 OK`: the created waypoint (same shape as request body).

**Error** `400`: `{ "error": "Missing required field: label" }` (example)

**Error** `500`: `{ "error": "Failed to create waypoint" }`

---

## PUT /api/waypoints/[id]

**Purpose**: Update an existing waypoint's fields (label, type, description, notes, position).

**Request body** (all fields optional; only provided fields are updated):
```json
{
  "label": "Updated label",
  "description": "Updated description",
  "position": { "x": 400, "y": 300 }
}
```

**Response** `200 OK`: the full updated waypoint.

**Error** `404`: `{ "error": "Waypoint not found" }`

**Error** `500`: `{ "error": "Failed to update waypoint" }`

---

## DELETE /api/waypoints/[id]

**Purpose**: Delete a waypoint. The caller is responsible for also deleting associated edges and
removing the waypoint from tours (optimistic state handles this; the API only deletes the
waypoint row — the client sends separate edge/tour update requests if needed, or edge/tour
cleanup happens on the client side via separate DELETE/PUT calls).

> **Note**: The client handles cascade cleanup in the same optimistic handler that calls this
> endpoint (matching Phase 1 behavior). The API itself only deletes the waypoint row.

**Request**: No body.

**Response** `200 OK`: `{ "id": "w-1716000000000" }`

**Error** `404`: `{ "error": "Waypoint not found" }`

**Error** `500`: `{ "error": "Failed to delete waypoint" }`

---

## POST /api/edges

**Purpose**: Persist a newly created edge.

**Request body**:
```json
{
  "id": "e-1716000000000",
  "source": "w01",
  "target": "w02",
  "label": null
}
```

**Response** `200 OK`: the created edge.

**Error** `400`: `{ "error": "Missing required field: source" }` (example)

**Error** `500`: `{ "error": "Failed to create edge" }`

---

## DELETE /api/edges/[id]

**Purpose**: Delete an edge.

**Request**: No body.

**Response** `200 OK`: `{ "id": "e-1716000000000" }`

**Error** `404`: `{ "error": "Edge not found" }`

**Error** `500`: `{ "error": "Failed to delete edge" }`

---

## POST /api/tours

**Purpose**: Persist a newly created tour.

**Request body**:
```json
{
  "id": "t-1716000000000",
  "name": "My Tour",
  "description": "...",
  "waypointIds": ["w01", "w02", "w03"]
}
```

**Response** `200 OK`: the created tour.

**Error** `400`: `{ "error": "Missing required field: name" }` (example)

**Error** `500`: `{ "error": "Failed to create tour" }`

---

## PUT /api/tours/[id]

**Purpose**: Update a tour's name, description, or waypointIds. When `waypointIds` is provided,
the existing `TourWaypoint` rows for this tour are replaced atomically.

**Request body** (all fields optional):
```json
{
  "name": "Updated name",
  "waypointIds": ["w01", "w03", "w02"]
}
```

**Response** `200 OK`: the full updated tour.

**Error** `404`: `{ "error": "Tour not found" }`

**Error** `500`: `{ "error": "Failed to update tour" }`

---

## DELETE /api/tours/[id]

**Purpose**: Delete a tour and its associated `TourWaypoint` rows (cascade handled by Prisma
`onDelete: Cascade`).

**Request**: No body.

**Response** `200 OK`: `{ "id": "t-1716000000000" }`

**Error** `404`: `{ "error": "Tour not found" }`

**Error** `500`: `{ "error": "Failed to delete tour" }`

---

## Client-side optimistic update contract

All mutation handlers in `ShrimpApp` MUST follow this pattern:

1. **Snapshot** the current state slice before modification.
2. **Apply** the change to local state immediately (optimistic).
3. **Call** the corresponding API endpoint asynchronously (do not `await` in the render path).
4. On **success**: no further action needed (state already reflects the change).
5. On **error**: restore the snapshot via `setState(snapshot)` and set
   `setErrorMessage('...')`. Clear `errorMessage` after 5 seconds via `setTimeout`.

This pattern is implemented once per mutation type in `ShrimpApp.tsx`. No shared utility
function is needed at this scale.
