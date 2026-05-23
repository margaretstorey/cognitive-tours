# Feature Specification: Waypoint File Path

**Feature Branch**: `003-waypoint-filepath`

**Created**: 2026-05-22

**Status**: Draft

**Input**: User description: "Add an optional filePath field to Waypoint. Users can type a file path when creating or editing a waypoint. In the detail panel, if a filePath exists, show it as a clickable element that copies the path to the clipboard when clicked, with a visual confirmation (e.g. "Copied!"). The filePath should be persisted in the database. No file browser, no validation of the path — just a plain text field. Works for all waypoint types — the field is always optional."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Record and Copy a File Path (Priority: P1)

A user creates or edits a waypoint and types a file path into the optional File Path field. Later,
when viewing that waypoint in the detail panel, they click the displayed file path and it is
instantly copied to their clipboard, with a brief "Copied!" confirmation so they know it worked.
They can then paste it wherever they need it — a terminal, an editor, a chat message.

**Why this priority**: The core value of this feature is frictionless navigation between the
understanding map and actual code. Without copy-to-clipboard, typing the path manually defeats
the purpose. Input and copy must ship together as a single usable unit.

**Independent Test**: Open the create waypoint form, enter any file path (e.g.
`src/components/ShrimpApp.tsx`), save, select the waypoint, and click the path in the detail
panel. Verify the clipboard contains the path and a brief confirmation appears.

**Acceptance Scenarios**:

1. **Given** the create/edit waypoint form is open, **When** the user types a file path into the
   File Path field, **Then** the path is saved with the waypoint and visible in the detail panel.
2. **Given** a waypoint with a file path is selected, **When** the user clicks the path in the
   detail panel, **Then** the path is copied to the clipboard and a "Copied!" confirmation appears
   briefly, then disappears.
3. **Given** a waypoint has no file path, **When** the user views it in the detail panel, **Then**
   no file path element is shown (the field is absent, not shown as empty).
4. **Given** a user reloads the page, **When** they select a waypoint that had a file path,
   **Then** the file path is still shown (it is persisted).

---

### Edge Cases

- What happens if the user clears a file path that was previously set? The field saves as empty,
  and the detail panel shows no path element (treated the same as never having been set).
- What happens if the clipboard API is unavailable (e.g., insecure context)? The click has no
  visible effect. No crash or error is shown; the path text is still readable.
- What if the path contains unusual characters (spaces, unicode, backslashes)? The path is stored
  and displayed as-is. No normalization or escaping is applied.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Waypoint data model MUST include an optional `filePath` field that accepts any
  plain text string.
- **FR-002**: The create and edit waypoint form MUST include an optional "File Path" text input
  field. The field MUST NOT be required.
- **FR-003**: When saving a waypoint, the `filePath` value MUST be persisted alongside all other
  waypoint fields.
- **FR-004**: In the waypoint detail panel, if a `filePath` value exists, it MUST be displayed as
  a clickable element.
- **FR-005**: When the user clicks the file path element in the detail panel, the path MUST be
  copied to the system clipboard.
- **FR-006**: After a successful clipboard copy, a brief visual confirmation (e.g., "Copied!") MUST
  appear near the path and disappear automatically after approximately 2 seconds.
- **FR-007**: If a waypoint has no `filePath`, the detail panel MUST NOT render any file path
  element (the section is hidden entirely, not shown as empty).
- **FR-008**: The `filePath` field MUST be available for all waypoint types without restriction.

### Key Entities

- **Waypoint**: gains one new optional field — `filePath: string | undefined`. All other fields
  are unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can enter a file path when creating or editing a waypoint and see it
  displayed in the detail panel after saving — verifiable in a single browser session.
- **SC-002**: Clicking the displayed file path copies it to the clipboard in 100% of attempts in
  a standard desktop browser context (Chrome, Firefox, Safari, Edge).
- **SC-003**: The "Copied!" confirmation appears within 500 ms of the click and disappears without
  user action.
- **SC-004**: A file path set in one session is still present after a page reload (persistence
  verified by reload test).

## Assumptions

- No file browser or path picker is provided — the user types the path as free text.
- No validation of the path is performed (the app does not check whether the path exists on any
  filesystem).
- The `filePath` field stores exactly what the user typed, with no normalization, trimming beyond
  standard text input handling, or escaping.
- The clipboard copy uses the standard Web Clipboard API (`navigator.clipboard.writeText`). No
  fallback for very old browsers is required.
- This feature applies to all eight existing waypoint types equally; no type-specific behaviour.
- Updating `filePath` to an empty string is treated the same as removing it — the detail panel
  shows no path element.
