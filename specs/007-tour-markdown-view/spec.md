# Feature Specification: Tour Markdown View

**Feature Branch**: `007-tour-markdown-view`

**Created**: 2026-06-29

**Status**: Draft

**Input**: User description: "When a user opens a tour, they can toggle to a markdown view of that tour directly from the tour bar. The markdown is generated live from the database (not stored) — it renders the tour title, description, and each waypoint stop in order (waypoint name as heading, description/notes as body, docent narrative as transition text if present). A separate Export action lets the user save a dated markdown snapshot to the tours/ folder in the project (e.g. tours/triple-debt-tour-2026-06-29.md). This frozen snapshot lives in the repo and is versioned with git. It is distinct from the live view."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Toggle Live Markdown View from Tour Bar (Priority: P1)

A developer has a tour open in the tour bar and wants to read it as a flowing document rather than navigating the graph step by step. They click a toggle in the tour bar and the graph panel is replaced by a live-rendered markdown document showing the tour title, description, and each waypoint in sequence — waypoint name as a heading, description and notes as body text, and docent narrative (if present) as transition text below each stop.

**Why this priority**: This is the core reading experience. It delivers standalone value and is prerequisite to the export feature.

**Independent Test**: Select any tour in the tour bar, click the markdown toggle, verify the panel shows the tour title, description, and each waypoint's name/description/notes/docent text in sequence. Toggle back and confirm the graph is restored.

**Acceptance Scenarios**:

1. **Given** a tour is active, **When** the user clicks the markdown toggle, **Then** the graph panel is replaced by a rendered markdown document showing the tour content
2. **Given** the markdown view is active, **When** the user clicks the toggle again, **Then** the graph panel is restored and the tour remains active
3. **Given** a waypoint has a docent narrative, **When** its section is rendered, **Then** the docent text appears as transition text beneath the waypoint's main content
4. **Given** a waypoint has no notes or docent text, **When** its section is rendered, **Then** only the title and description appear (no empty headings or blank blocks)
5. **Given** no tour is active, **When** the tour bar is shown, **Then** the markdown toggle is disabled or hidden

---

### User Story 2 - Export Tour as Dated Markdown Snapshot (Priority: P2)

A developer wants to save a point-in-time record of the active tour as a markdown file. They click an Export button, and a file is written to the `tours/` folder named by tour slug and today's date (e.g., `tours/triple-debt-tour-2026-06-29.md`). The file is then versioned with git like any other file in the repo.

**Why this priority**: Valuable for sharing and archiving, but secondary to the live reading experience.

**Independent Test**: Activate a tour, click Export, verify a file appears in `tours/` with the correct name and format, containing the tour's current content.

**Acceptance Scenarios**:

1. **Given** a tour is active, **When** the user clicks Export, **Then** a file is written to `tours/<tour-slug>-<YYYY-MM-DD>.md` with the tour's current content
2. **Given** a file with the same name already exists, **When** the user exports again on the same day, **Then** the existing file is overwritten with fresh content
3. **Given** the export completes, **When** the user opens the downloaded file, **Then** it contains the tour title, description, waypoint count, each waypoint section in order, and a datestamp
4. **Given** the export completes, **When** the user places the file in `tours/` and runs `git status`, **Then** it appears as an untracked or modified file ready to commit

---

### Edge Cases

- What appears when a tour has zero waypoints and markdown toggle is clicked?
- How are waypoints with no description and no notes rendered (heading only)?
- What if the tour name contains characters that are invalid in a filename (e.g., `/`, `:`)?
- What happens if the `tours/` folder is missing at export time?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tour bar MUST include a toggle control that switches the graph panel between graph view and markdown view when a tour is active
- **FR-002**: The markdown view MUST be generated live from the database each time it is opened — it MUST NOT be stored in the database
- **FR-003**: The markdown view MUST render in this order: tour title (H1), tour description, then each waypoint stop in tour sequence order
- **FR-004**: Each waypoint section MUST render: waypoint name as a heading, description as body text, notes as body text (if present), docent narrative as transition text (if present)
- **FR-005**: The markdown view MUST be read-only — no editing controls appear within it
- **FR-006**: The markdown toggle MUST only be active when a tour is currently selected in the tour bar
- **FR-007**: The tour bar MUST include a separate Export button (distinct from the markdown toggle) that triggers a browser file download of the tour as a `.md` file — it MUST NOT write to the server filesystem
- **FR-008**: The downloaded filename MUST follow the pattern `<tour-slug>-<YYYY-MM-DD>.md` where the slug is the tour name lowercased with spaces replaced by hyphens and special characters removed
- **FR-009**: Exporting MUST be a deliberate user gesture — it MUST NOT happen automatically on toggle or navigation

### Key Entities

- **Tour**: has a name, description, and ordered list of waypoints; the markdown view renders one tour at a time
- **Waypoint**: has title, type, description, notes, filePath; any field except title may be empty
- **TourWaypoint**: join record that includes the sequence position and the docent narrative field
- **Markdown Snapshot**: a static file in `tours/`, named by tour slug and export date; stored in the repo, never in the database

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch between graph view and markdown view in one click with no page reload
- **SC-002**: The markdown view renders a 10-waypoint tour in under 1 second
- **SC-003**: Exported files are valid markdown that render correctly in GitHub's markdown preview and VS Code's markdown preview
- **SC-004**: The markdown toggle and export button are discoverable without instruction — a first-time user can find them by scanning the tour bar
- **SC-005**: Export produces a file that `git status` recognises as a new or modified file, confirming it is written to the working directory

## Assumptions

- The `tours/` folder already exists with at least one existing snapshot (`re-entry-tour-june2.md`); if absent, it will be created on first export
- Tour waypoint sequence order is determined by the existing `TourWaypoint` join table (same order used by Next/Prev navigation)
- The docent narrative field lives on the `TourWaypoint` join record, not the `Waypoint` itself
- The markdown view replaces the React Flow graph panel in the left pane — it does not open in a new tab or modal
- Export triggers a browser file download; the user manually places the downloaded file in `tours/` and commits it to git (Vercel production has a read-only filesystem)
- Slug generation strips characters outside `[a-z0-9-]` and collapses multiple hyphens
- Mobile layout and multi-user concurrency are out of scope for this feature
