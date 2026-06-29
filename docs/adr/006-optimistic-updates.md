# ADR 006: Optimistic Updates for All Mutations

**Status:** Accepted  
**Date:** 2026-05-22  
**Related:** app/components/CognitiveToursApp.tsx

---

## Context

Cognitive Tours is an interactive graph application -- users drag nodes, 
connect edges, create and delete waypoints in rapid succession. Any visible 
delay between an action and its effect would feel jarring and break the 
flow of understanding construction.

Two approaches were considered for handling mutations:

**Pessimistic** -- wait for database confirmation before updating the UI:
- User clicks "Delete waypoint"
- App sends request to database
- App waits for confirmation
- Only then does the node disappear
- Feels slow

**Optimistic** -- assume success and update immediately:
- User clicks "Delete waypoint"
- Node immediately disappears from the graph
- App sends request to database in the background
- If confirmed -- nothing changes, already done
- If failed -- node reappears and error banner shows
- Feels instant

---

## Decision

Use optimistic updates for all mutations -- waypoint create, edit, delete, 
edge create, delete, tour create, edit, delete.

---

## Consequences

**Positive:**
- The graph feels responsive and natural for interactive use
- No visible delay for any user action

**Negative:**
- Very occasionally a write fails silently -- the user thinks they deleted 
  something but it's still in the database. The error banner handles this 
  but the user must take action to reconcile.

---

## Implementation

All mutation handlers live in `app/components/CognitiveToursApp.tsx`. Each 
handler updates local React state immediately, then fires the API call. On 
failure, state is reverted and an error banner is shown.