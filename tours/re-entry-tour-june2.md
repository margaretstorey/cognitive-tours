# Cognitive Tour: Re-entry — June 2, 2026
# deprecated right now but keep it as an idea for future tour template idea
# note : I played around with saving tours as markdown - will come back to this

## Purpose
Help Margaret-Anne pick up where she left off and answer the question:
**what should I work on today?**

This is not a general orientation. It is a point-in-time snapshot of project
state as of June 2, 2026, designed to rebuild working context quickly after
time away.

## Audience
Margaret-Anne returning to Cognitive Tours after a break.

---

## Waypoints

### Waypoint 1: Orient — What Was Just Shipped
**Artifact:** `CLAUDE.md` → "What is built and working" section
**Why it matters:** The filter feature (005-waypoint-type-filter) was just
completed and merged as PR #7. The "What is built" section reflects this.
However, the "What to work on next" list still shows filter as item 2 —
it needs to be removed. Start here to get your bearings.
**Understanding gained:** The last thing you shipped, and that the priority
list needs a small cleanup before you trust it.

### Waypoint 2: The Last Thing You Built
**Artifact:** `specs/005-waypoint-type-filter/` → `plan.md` and `tasks.md`
1in tasks.md were executed. If anything feels unfamiliar, skim the spec to
remind yourself what was decided and why.
**Understanding gained:** Confirmation that 005 is fully done and you can
stop thinking about it.

### Waypoint 3: The Immediate Next Task — Repair the Waypoints
**Artifact:** `CLAUDE.md` → "Known issues" + "What to work on next" item 1
**Why it matters:** The app still has a rogue waypoint ("tiago forte second
brain", id: w-1779834401416) and all waypoint labels say "Shrimp" instead
of "Cognitive Tours". A Goal-level node doesn't exist yet. This is hands-on
work done inside the running app — not a code change.
**Understanding gained:** The most concrete thing you can do right now,
requires no spec or planning, just open the browser and do it.

### Waypoint 4: Second Task — Refine the New Developer Orientation Tour
**Artifact:** `app/lib/mock-data.ts` lines 113–126 (INITIAL_TOURS, tour t01)
**Why it matters:** The current orientation tour ends on "How should
waypoints be exported/shared?" — an open question that deflates a newcomer.
The tour needs reordering to end on something affirmative. This is a small
edit to mock-data.ts (or done directly in the running app).
**Understanding gained:** What needs to change and where the data lives.

### Waypoint 5: The Missing Decision Record
**Artifact:** `docs/adr/` — only ADR 001 (React Flow) and ADR 002 (local
state, superseded) exist
**Why it matters:** The SQLite + Prisma + better-sqlite3 decision has no
ADR. ADR 002 is marked superseded but nothing replaced it. This rationale
is currently only in CLAUDE.md and will be lost as the project evolves.
Writing ADR 003 before moving on prevents a future contributor (or future
you) from having to reconstruct why these choices were made.
**Understanding gained:** A small but important gap to fill before the
context is gone.

---

## Questions This Tour Answers
1. What did I just ship and is it fully done?
2. What is the single most immediate task I can start right now?
3. What is the second task after that?
4. What cognitive debt risk am I about to leave behind if I move on?
5. Does the "what to work on next" list reflect current reality?

---

## Cognitive Debt Risks
- The priority list in CLAUDE.md is stale: item 2 (filter) is done but not
  removed. A returning developer who trusts the list without checking will
  start the wrong thing.
- No ADR for SQLite decision. The longer this goes unwritten, the harder it
  will be to reconstruct the reasoning.
- Waypoint data still says "Shrimp" throughout. Running the app with a
  collaborator before repairing this is misleading.
- Known issue "No way to filter graph by waypoint type" in CLAUDE.md is now
  false — it should be removed.

---

## Freshness Check
**Stale by design after June 2, 2026.**
This tour is a point-in-time snapshot. Once the waypoints are repaired and
the orientation tour is refined, this file should be archived or replaced
with a new re-entry tour reflecting the updated state.

---

## Maintenance Rules
1. Do not update this file — it is a dated snapshot. Write a new one instead.
2. Archive this file (e.g., `tours/archive/`) once its tasks are complete.
3. The naming convention is `re-entry-tour-<date>.md` — follow it for future
   re-entry tours so they sort chronologically.
