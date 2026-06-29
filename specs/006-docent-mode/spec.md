# Feature Specification: Docent Mode — Per-Step Tour Narrative

**Feature Branch**: `006-docent-mode`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Feature: Docent Mode -- Per-step narrative for tours"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Author Writes Narrative Per Stop During Tour Creation/Edit (Priority: P1)

A tour author creates or edits a tour and wants to add explanatory narrative to each stop, explaining the significance of that waypoint and why the tour moves from one stop to the next. The narrative is optional — a stop with no narrative is perfectly valid.

**Why this priority**: Without the ability to author narrative, readers can never see it. This is the foundational authoring capability that enables everything else.

**Independent Test**: Can be fully tested by creating a tour, entering narrative text for one or more stops, saving, and verifying that the narrative was persisted.

**Acceptance Scenarios**:

1. **Given** a tour is open in the editor, **When** the author clicks into the narrative text area for a stop, **Then** they can type and save free-form text for that stop.
2. **Given** a stop already has narrative, **When** the author edits the text area and saves, **Then** the updated narrative replaces the old one.
3. **Given** a stop's narrative text area is left empty, **When** the tour is saved, **Then** no narrative is stored for that stop and the stop is treated as having none.

---

### User Story 2 — Reader Sees Guided Narrative While Stepping Through a Tour (Priority: P1)

A tour reader is stepping through a tour using the Prev/Next controls and wants to feel guided — to understand not just which waypoint they are on, but why they are here and where they are going next.

**Why this priority**: This is the core reader-facing value of the feature. Without it, authored narrative has no visible effect.

**Independent Test**: Can be fully tested by entering a tour that has at least one stop with narrative, stepping through the stops, and verifying that narrative appears below the tour bar and updates at each step.

**Acceptance Scenarios**:

1. **Given** the reader is on a stop that has narrative, **When** they view the tour, **Then** the narrative text is displayed in a highlighted area below the tour bar.
2. **Given** the reader presses Next or Prev, **When** the current stop changes, **Then** the narrative area updates to show the new stop's narrative (or disappears if the new stop has none).
3. **Given** the reader is on a stop with no narrative, **When** they view the tour, **Then** there is no visible box, gap, or placeholder below the tour bar.

---

### User Story 3 — Author Updates Narrative After Tour Creation (Priority: P2)

A tour author returns to a previously created tour and wants to refine the narrative for one or more stops — improving the wording, adding context learned since the tour was first written, or removing narrative that is no longer relevant.

**Why this priority**: Narrative quality improves over time as authors reflect on a codebase. Post-creation editing enables this refinement without recreating the tour.

**Independent Test**: Can be fully tested by opening an existing tour, changing narrative on a stop, saving, and verifying the updated text appears when reading the tour.

**Acceptance Scenarios**:

1. **Given** an existing tour with narrative on some stops, **When** the author opens the tour editor, **Then** the current narrative for each stop is pre-populated in the text areas.
2. **Given** the author modifies narrative on one or more stops, **When** they save, **Then** only the edited stops are updated — other stops are unchanged.
3. **Given** the author clears narrative from a stop that previously had it, **When** saved, **Then** that stop is treated as having no narrative and shows nothing to readers.

---

### Edge Cases

- What happens when narrative is very long (several paragraphs)? The display area should scroll or expand rather than truncating silently.
- What happens if the same tour is open in two browser tabs and narrative is updated in one? The other tab shows stale narrative until refreshed — acceptable for now given the single-user assumption.
- What happens if a waypoint is removed from a tour that had narrative for that stop? The narrative for the removed stop is deleted along with the tour-waypoint association.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a nullable text narrative to be stored for each individual stop in a tour.
- **FR-002**: The tour editor MUST display a text input area for each stop where the author can enter or edit narrative.
- **FR-003**: Narrative text areas in the editor MUST be pre-populated with existing narrative when editing a tour.
- **FR-004**: Authors MUST be able to save updated narrative for any stop in an existing tour without recreating the tour.
- **FR-005**: The reader view MUST display the current stop's narrative in a visually distinct highlighted area below the tour navigation bar.
- **FR-006**: The narrative display area MUST update immediately when the reader moves to a different stop (Prev/Next).
- **FR-007**: When the current stop has no narrative, the system MUST NOT render any visible container, gap, or placeholder in the reader view.
- **FR-008**: Narrative MUST persist across page refreshes and browser sessions.
- **FR-009**: Clearing a stop's narrative and saving MUST remove any stored narrative for that stop (not store an empty string that shows up as whitespace).

### Key Entities

- **TourWaypoint** (join table between Tour and Waypoint): gains an optional `narrative` field — free-form text associated with a specific waypoint's position within a specific tour. Null and empty string are treated equivalently as "no narrative."
- **Tour**: unchanged structurally; narrative belongs to the stop (TourWaypoint), not the tour as a whole.
- **Waypoint**: unchanged; narrative is tour-specific so the same waypoint can have different narrative in different tours.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A tour author can add narrative to any stop in under 30 seconds without leaving the tour editor.
- **SC-002**: Narrative appears below the tour bar with no perceptible delay when the reader steps to a stop that has it.
- **SC-003**: Stops without narrative produce zero visual change below the tour bar — no gap, no box, no whitespace.
- **SC-004**: Narrative for all stops in a tour is persisted and survives page reload.
- **SC-005**: Updating narrative on one stop does not alter narrative on any other stop in the tour.

---

## Assumptions

- Single-user environment — no concurrency or conflict resolution needed for narrative edits.
- Tour editor is the existing `TourBar` component; narrative text areas are added within that existing editing flow rather than as a separate screen.
- Narrative is plain text for now — no rich text formatting (bold, links, etc.) required in this iteration.
- Narrative authored for a stop is specific to that tour; the same waypoint can carry different narrative in a different tour (the narrative lives on the TourWaypoint join record, not the Waypoint itself).
- Empty string saved in the narrative field is normalised to null before storage, so "no narrative" is unambiguous.
- Narrative display is rendered on the client from data already loaded with the tour — no additional round-trip required when stepping stops.
