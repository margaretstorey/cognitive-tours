# Research: Waypoint File Path

**Feature**: `003-waypoint-filepath` | **Date**: 2026-05-22

No unknowns exist in the Technical Context. The user provided the complete implementation
approach. This document records the key decisions for traceability.

---

## Decision 1: Nullable column, optional TypeScript field

**Decision**: Store `filePath` as `String?` in Prisma (nullable SQLite `TEXT`) and `string |
undefined` in TypeScript.

**Rationale**: The field is always optional. Prisma's `String?` maps to `string | null` at the
DB layer; `toWaypoint()` converts `null` → `undefined` for consistency with the existing `notes`
field pattern already used in this codebase.

**Alternatives considered**: A separate table for file attachments — rejected as over-engineering
for a single plain-text field.

---

## Decision 2: Web Clipboard API with silent failure

**Decision**: Use `navigator.clipboard.writeText()` directly in the React component. Errors
are silently swallowed (`.catch(() => {})`) with no fallback.

**Rationale**: The spec explicitly states no error should be shown if the Clipboard API is
unavailable. The API is available in all browsers the app targets (modern desktop Chrome,
Firefox, Safari, Edge on HTTPS). A `document.execCommand` fallback would add complexity with
no practical benefit.

**Alternatives considered**: `execCommand('copy')` fallback — rejected per spec assumption
and constitution Principle I (Simplicity).

---

## Decision 3: Empty string treated as absent

**Decision**: When saving the form, `filePath: value.trim() || undefined` — an empty or
whitespace-only string is treated the same as never having been set.

**Rationale**: The spec states this explicitly. It prevents empty `filePath` rows cluttering
the DB and keeps the detail panel logic simple (`if (waypoint.filePath)`).

---

## Decision 4: No ShrimpApp changes needed

**Decision**: `updateWaypoint` in `ShrimpApp.tsx` already passes `Partial<Omit<Waypoint,
'id'>>` to the API, so `filePath` flows through without any handler changes.

**Rationale**: The existing data-flow design for partial updates handles new optional fields
automatically. This confirms the Phase 2 architecture was designed correctly.
