# Feature Specification: Multi-Team Support

**Feature Branch**: `009-multi-user-support`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "Multi-team support for the Startup Studio course (Fall 2026, course starts September; target August). Several student teams use Cognitive Tours at once. Each team works in its own space reached via one link per team, with no login. Contributors are attributed via a self-reported author name. Concurrent edits by teammates must never silently overwrite each other (today a tour save deletes and recreates all stops, so the second save wipes the first person's stops and narratives). Deleted or overwritten work is recoverable. An instructor can view all teams' maps and tours. Background and options: GitHub issue #10. Open decisions to mark for clarification rather than decide: isolation model, identity mechanism, cross-team visibility, research-data consent."

## Clarifications

### Session 2026-09-24

- Q: What is the access boundary for a team space? → A: Anyone holding the team's link can view and edit; the link is the only key, with no login and no secret. Links are **readable** (based on the team name). Random, non-guessable links were considered and deliberately not chosen.
- Q: Can teams see each other's maps? → A: No. Because readable links can be guessed, this is a **class norm, not something the app enforces**: the app never lists or links to other teams' spaces, and teams are asked not to open each other's links. Q1 and Q2 were decided together, accepting this trade-off for a trusted classroom.
- Q: Will student edits be used as research data? → A: No. Edit history exists only for recovery, and is deleted when its team space is deleted. No ethics approval is required.

## Context

Cognitive Tours is currently single-user: everyone who opens the app sees and edits one shared map, nothing records who made a change, and when two people edit the same item, the later save silently replaces the earlier one. In the worst case, saving a tour replaces its entire list of stops, so one teammate's save can erase another teammate's stops and narratives without either of them noticing. Issue #10 lays out the challenges and options in full.

The Startup Studio course (starting September 2026) will have several student teams building their own waypoints and tours at the same time. The tool's premise, that people build understanding by making tours themselves, depends on students trusting that their work stays theirs and stays put.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Teammates edit without losing each other's work (Priority: P1)

Two members of the same team have the same tour open. One reorders the stops and adds a narrative; the other, a minute later, edits a different stop's narrative and saves. Neither person's change disappears. If both changed the *same* thing, the second person is told that someone else changed it first, sees what changed, and chooses what to keep. Nothing is lost silently.

**Why this priority**: Silent data loss is the one current behaviour that actively harms users, and it gets worse with every extra person editing. It's also independent of every other decision in this spec: it's needed whether teams have separate spaces or not, and it already protects the live app today.

**Independent Test**: Open the same tour in two browser windows, make different edits in each, save both, and confirm both edits are present. Then make conflicting edits to the same field and confirm the second saver is warned, not overwritten.

**Acceptance Scenarios**:

1. **Given** two people have the same tour open, **When** they each edit a *different* stop and save, **Then** both edits are kept.
2. **Given** two people have the same waypoint open, **When** both edit its description and the second one saves, **Then** the second person is told that the waypoint was changed since they opened it (and by whom, if known), and their save doesn't replace the other change without their say-so.
3. **Given** a person's save was stopped because of a conflict, **When** they choose to reload, **Then** they see the latest version, and their unsaved text is still available to copy back in.

---

### User Story 2 - Each team works in its own space via its own link (Priority: P1)

The instructor creates a space for each team and hands out one link per team. Students open their team's link and see only their team's waypoints, edges and tours, starting from an empty map (or a starter map). They create and edit freely. Nothing they do affects any other team or the existing Cognitive Tours self-documentation map.

**Why this priority**: Without separate spaces, several teams would build in one shared map and trip over each other's content. This is the core requirement for running the course at all.

**Independent Test**: Create two team spaces, add a waypoint in each, and confirm each team's link shows only its own waypoint and that edits in one never appear in the other.

**Acceptance Scenarios**:

1. **Given** the instructor has created spaces for Team A and Team B, **When** a student opens Team A's link, **Then** they see only Team A's waypoints, edges and tours.
2. **Given** a student is in Team A's space, **When** they create, edit or delete anything, **Then** Team B's space and the existing self-documentation map are unchanged.
3. **Given** someone has a team's link, **When** they open it, **Then** they can view and edit that team's space with no login and no further check.
4. **Given** a student in Team A's space, **When** they look for other teams' work, **Then** the app shows no list of, or links to, other teams' spaces. Teams are asked not to open each other's links (a class norm); the app doesn't prevent someone who types another team's link from opening it.

---

### User Story 3 - Contributions are attributed to their authors (Priority: P2)

The first time a student opens their team's link, they're asked for their name. The app remembers it on that device. Every waypoint, tour and tour stop narrative they create or change records their name and when it happened, and this is visible on the waypoint's detail view and in a tour's markdown view and export.

**Why this priority**: Attribution lets teammates see who wrote what and lets the instructor see contribution. It's also a prerequisite for the conflict message ("changed by Sam at 2:14pm") in Story 1. It's P2 because the course can run without it, but not well.

**Independent Test**: Set an author name, create a waypoint and edit a tour, then confirm the name and time appear on the waypoint's detail view and the tour's markdown view and export.

**Acceptance Scenarios**:

1. **Given** a person opens a team link for the first time on a device, **When** the space loads, **Then** they're asked for a display name before they can edit (they can still view without entering one).
2. **Given** a person has set their name, **When** they create or edit a waypoint or tour, **Then** the item shows their name as the last editor, with a timestamp.
3. **Given** a person wants to change their name (a typo, or a shared computer), **When** they choose to change it, **Then** future edits use the new name. Past edits keep the name they were made under.

---

### User Story 4 - Deleted or overwritten work can be recovered (Priority: P2)

A student deletes a waypoint by mistake, or replaces a carefully written narrative. They (or a teammate) can find the deleted waypoint in a "recently deleted" list and restore it, including its edges and its place in any tours, and can see and restore earlier versions of a changed item.

**Why this priority**: There's no undo in the app today, and with many new users, mistakes are certain. Recovery turns a lost afternoon of work into a two-click fix. It's P2 because Story 1 prevents most loss up front.

**Independent Test**: Delete a waypoint that appears in a tour and has edges, restore it from the recently deleted list, and confirm the waypoint, its edges and its tour positions are all back.

**Acceptance Scenarios**:

1. **Given** a waypoint that has edges and is a stop in a tour, **When** a team member deletes it and then restores it from the recently deleted list, **Then** the waypoint, its edges and its tour positions are all restored.
2. **Given** a tour stop's narrative was changed, **When** a team member looks at that stop's history, **Then** they can see earlier versions with author and time, and restore one.
3. **Given** a deleted item, **When** the recovery period ends, **Then** it's permanently removed.

---

### User Story 5 - The instructor sees all teams (Priority: P3)

The instructor opens an overview that lists every team space with basic activity (number of waypoints and tours, last activity, contributors) and can open any team's map and tours to read them, without accidentally editing them.

**Why this priority**: Needed for teaching and assessment but not for students to do their work; it can arrive shortly after the course starts if needed.

**Independent Test**: With two team spaces containing content, open the instructor overview and confirm both teams are listed with correct counts and last activity, and that each team's map opens read-only.

**Acceptance Scenarios**:

1. **Given** several team spaces exist, **When** the instructor opens the overview, **Then** every team is listed with its waypoint count, tour count, contributors and last activity time.
2. **Given** the instructor opens a team's space from the overview, **When** they browse it, **Then** they can view everything (graph, tours, markdown view, export) and edits are disabled unless they explicitly switch to editing.
3. **Given** a student, **When** they try to reach the instructor overview, **Then** they can't.

---

### Edge Cases

- **Offline or failed save**: a save that fails (network loss) must say so and keep the unsaved text, never appear to succeed.
- **Stale view**: a person has had a tour open for an hour while teammates changed it. When they come back to the tab, they should see the latest version, or at least be told it's out of date, before editing.
- **Deleting a waypoint used in someone else's open tour**: the other person's tour view must not break; the stop shows as removed (and restorable).
- **Deleting a tour a teammate is editing**: the teammate's save is refused with an explanation, and their unsaved content is still available to copy.
- **Two tabs, one person**: the same person with two tabs open is treated like two editors. Conflicts are still caught.
- **No name set**: a person who declines to enter a name can view but not edit; the prompt must be easy to find again.
- **Same name on two people**: two students both called "Alex". The app doesn't enforce unique names; attribution shows what people typed. The Assumptions section explains why.
- **Lost or leaked link**: the instructor must be able to give a team a new link and invalidate the old one.
- **A student opens another team's link**: links are readable, so this is possible. They can view and edit that space. Their display name is recorded on any change they make, and those changes can be undone through recovery (Story 4).
- **The existing map**: the current Cognitive Tours self-documentation map must remain intact and reachable, unaffected by team spaces.
- **Course end**: team spaces and their content must remain readable after the course (for grading and portfolios) until the instructor deletes them.

## Requirements *(mandatory)*

### Functional Requirements

**Concurrent editing (Story 1)**

- **FR-001**: The system MUST NOT let a save silently replace a change made by someone else since the saver last loaded that item.
- **FR-002**: When a save conflicts with a newer change, the system MUST tell the person, identify who made the newer change and when (if known), and keep the person's unsaved input available.
- **FR-003**: Edits to different stops of the same tour MUST NOT conflict with each other; only edits to the same stop, or to the tour's own name, description or stop order, count as conflicts.
- **FR-004**: The system MUST make other people's changes visible without a manual page refresh at least when a person returns to the tab, and within a short interval while the tab is open (see SC-004).

**Team spaces (Story 2)**

- **FR-005**: The instructor MUST be able to create, rename and delete team spaces, and get each space's link.
- **FR-006**: Everything a team creates (waypoints, edges, tours, tour stops, narratives) MUST belong to exactly one team space and appear only there.
- **FR-007**: Actions in one team space MUST NOT change any other team space or the existing self-documentation map.
- **FR-008**: The instructor MUST be able to replace a team's link, invalidating the old one.
- **FR-009**: A new team space MUST start empty, with the option to start from a copy of a starter map chosen by the instructor.
- **FR-010**: Each team space MUST have a readable link, based on the team's name, that gives whoever holds it full view and edit access to that space, with no login.
- **FR-011**: The app MUST NOT list, search or link to other teams' spaces from within a team space. Not opening other teams' links is a class norm and isn't enforced.

**Attribution (Story 3)**

- **FR-012**: The system MUST ask for a display name before a person's first edit on a device, and remember it on that device.
- **FR-013**: Each waypoint, tour and tour stop MUST record who created it, who last changed it, and when.
- **FR-014**: Attribution MUST be visible on the waypoint detail view, in the tour markdown view, and in exported tour and full-map markdown.
- **FR-015**: A person MUST be able to change their display name; past attribution stays as recorded.

**Recovery (Story 4)**

- **FR-016**: Deleting a waypoint, edge, tour or tour stop MUST be reversible for a recovery period of 30 days.
- **FR-017**: Restoring a deleted waypoint MUST restore its edges and its positions in tours that still exist.
- **FR-018**: The system MUST keep earlier versions of waypoint descriptions and notes, tour descriptions, and stop narratives, with author and time, and let team members restore one.
- **FR-019**: Edit history and recovery MUST be limited to the team's own space.
- **FR-020**: Edit history MUST be kept only for recovery (FR-016–FR-018), MUST be deleted when its team space is deleted, and MUST NOT be exported or used as research data.

**Instructor overview (Story 5)**

- **FR-021**: The instructor MUST have an overview of all team spaces showing waypoint count, tour count, contributors and last activity.
- **FR-022**: The instructor MUST be able to open any team space read-only, and switch to editing only by an explicit action.
- **FR-023**: Students MUST NOT be able to reach the instructor overview or instructor actions.

**Continuity**

- **FR-024**: All existing features (graph, full map, tours, docent mode, markdown view and export, filters, search) MUST work the same inside each team space.
- **FR-025**: The existing self-documentation map and its tours MUST remain available and unchanged.

### Key Entities

- **Team space**: a named, separate workspace belonging to one team. It has an access link (readable, based on the team name, replaceable), a created date, and optionally the starter map it was copied from. It contains all of that team's waypoints, edges and tours.
- **Contributor**: a display name a person enters on a device. It isn't an account, and isn't guaranteed unique. It's recorded on every change.
- **Waypoint, Edge, Tour, Tour stop** (existing): each now belongs to one team space and carries who created it, who last changed it and when, plus whether it's deleted (and when).
- **Change record**: an earlier version of an item's text fields, with author and time. It supports restore only (see FR-020).
- **Instructor**: the person who manages team spaces and can see all of them. There's one instructor role for this course.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a test with two people editing the same tour at the same time, 100% of edits to different stops survive, and 100% of same-field conflicts produce a warning instead of a silent overwrite.
- **SC-002**: Zero reported incidents of students losing work to a teammate's save during the course's first four weeks.
- **SC-003**: A mistakenly deleted waypoint, with its edges and tour positions, can be restored by a student in under 1 minute without instructor help.
- **SC-004**: A teammate's saved change appears in another open tab within 30 seconds, and immediately when that tab is returned to.
- **SC-005**: The instructor can set up spaces for 12 teams and distribute their links in under 15 minutes.
- **SC-006**: A new student goes from receiving a link to making their first attributed edit in under 2 minutes, with no account creation.
- **SC-007**: The instructor overview shows every team's current counts and last activity accurately, and loads in under 3 seconds with 12 teams of normal size.
- **SC-008**: After the course, 100% of each team's content is still viewable and exportable.

## Assumptions

- **Scale**: up to about 12 teams of 3–6 students, each team building up to about 100 waypoints and 20 tours. There's one instructor.
- **Timeline**: needed by August 2026 for a September course start. Stories 1 and 2 must be ready by the start; Stories 3–5 should be.
- **Setting**: a trusted classroom where students act in good faith. The app guards against accidents, not attacks. Keeping teams out of each other's spaces relies on a class norm (see Clarifications). The accepted risk is that a student could open or edit another team's space by guessing its readable link. Attribution (Story 3) shows who made any such change, and recovery (Story 4) can undo it.
- **Names aren't verified**: attribution records what people type. That's enough for teamwork and instructor visibility; it's not proof of authorship for grading. If grading ever needs verified authorship, the access decision in Clarifications would need revisiting.
- **Recovery period**: 30 days for deleted items. Edit history is kept for as long as the team space exists, and is deleted with it.
- **Real-time co-editing is out of scope**: live cursors or seeing someone type aren't included. Changes appear after they're saved (SC-004).
- **Separate storage vs shared storage is a planning decision**: whether team spaces are kept apart inside one store or in separate stores isn't a user-facing requirement. It's decided in `/speckit-plan`, subject to FR-006, FR-007 and SC-007.
- **Instructor access**: the instructor has their own private way into the overview (for example, a separate instructor link). The exact mechanism is decided in planning.
- **Existing deployment**: the current live app and its self-documentation map stay online throughout. Team spaces are added alongside it, not in place of it.
- **Related work**: CLAUDE.md priority item 7 (author and updated-at on tours and waypoints) is delivered by Story 3 and FR-013. Issue #10's checklist tracks progress.
