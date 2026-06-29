# API Contracts: Docent Mode — Per-Step Tour Narrative

These contracts describe the changed API surface for the Docent Mode feature. Only changed endpoints are listed.

---

## GET /api/data

### Response — Tour shape (changed)

```json
{
  "tours": [
    {
      "id": "t-...",
      "name": "string",
      "description": "string",
      "stops": [
        { "waypointId": "w1" },
        { "waypointId": "w2", "narrative": "This is why we look at w2 next." }
      ]
    }
  ]
}
```

**Change from previous**: `waypointIds: string[]` → `stops: TourStop[]`. Stops without narrative omit the `narrative` key entirely (not `null`, not `""`).

---

## POST /api/tours

### Request body (changed)

```json
{
  "id": "t-...",
  "name": "string",
  "description": "string",
  "stops": [
    { "waypointId": "w1" },
    { "waypointId": "w2", "narrative": "Optional narrative text for this stop." }
  ]
}
```

**Change from previous**: `waypointIds: string[]` → `stops: TourStop[]`.

### Response

Same shape as GET /api/data Tour object above.

### Validation
- `id` and `name` are required (unchanged).
- `stops` may be an empty array.
- `narrative` values that are empty strings are normalised to null before storage.

---

## PUT /api/tours/[id]

### Request body (changed)

All fields are optional patches.

```json
{
  "name": "optional string",
  "description": "optional string",
  "stops": [
    { "waypointId": "w1", "narrative": "Updated narrative." },
    { "waypointId": "w2" }
  ]
}
```

**Change from previous**: `waypointIds: string[]` → `stops: TourStop[]`. When `stops` is present, the existing `TourWaypoint` rows for this tour are deleted and recreated from the provided array (same behaviour as previous `waypointIds` replacement).

### Response

Same shape as GET /api/data Tour object above.

---

## DELETE /api/tours/[id]

No change.

---

## Unchanged endpoints

- GET /api/data (structure unchanged; Tour shape changed — see above)
- POST /api/waypoints
- PUT /api/waypoints/[id]
- DELETE /api/waypoints/[id]
- POST /api/edges
- DELETE /api/edges/[id]
