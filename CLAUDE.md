@AGENTS.md
Last updated: September 24 2026

# CLAUDE.md — The Cognitive Bridge
> This file is the cognitive layer — the bridge between intent (Spec Kit), 
> understanding (waypoints and tours), and code.

<!-- COGNITIVE LAYER START -->

# Cognitive Tours — Project State for AI Agents

> Read this before touching any code or making any suggestions.
> This is the cognitive layer — the bridge between intent (Spec Kit) and code.

---

## What this project is

**Cognitive Tours** is a software comprehension tool where developers create
waypoints and guided tours to navigate intent, decisions, and code together.
The core thesis: understanding cannot be outsourced or automated. Tours you
create yourself repair your own cognitive debt. AI is a scaffold, not a substitute.

**Domains:** cognitive.tours | cognitivetours.dev
**GitHub:** margaretstorey/cognitive-tours
**Research foundation:** Triple Debt Model paper (arXiv:2603.22106) see ACM Queue paper

---

## Current technical state

### What is built and working
- Next.js 16 + TypeScript + Tailwind + React Flow (@xyflow/react 12)
- SQLite + Prisma persistence — data survives page refresh
- Three-panel layout: graph (left), waypoint detail (right), tour bar (top)
- 8 waypoint types with colour coding
- Tours with Next/Prev navigation and tour focus mode 
- Edge dimming fixed — both endpoints must be outside the active tour for an edge/label to dim ✅
- Edge labels showing relationships between waypoints
- filePath field on waypoints with clipboard copy and VS Code link
- Create, edit, delete waypoints and tours
- Drag to connect waypoints with optional edge label prompt
- 30+ seeded waypoints and 4 tours (self-documenting — the app documents itself)
- Spec Kit installed with constitution at .specify/memory/constitution.md
- Filter/hide waypoints by type - toggle panel with active badge ✅
- Deployed to Vercel with Turso persistent SQLite (survives deploys, shared across users) ✅
- Root component renamed CognitiveToursApp, repo renamed to cognitive-tours ✅
- Page title fixed (was showing default "Create Next App") ✅
- Git repository reconnected in Vercel project settings — see Known Issues ✅
- README written and reflects current project state ✅
- Constitution updated to Cognitive Tours (v1.3.0) ✅  
- ADR 003 (Use Turso) written at docs/adr/003-use-turso.md ✅
- tours/ folder established for markdown tour exports ✅
- Docent mode — per-step narrative on tour stops, displayed in amber bar below tour bar ✅
- Markdown view for tours (toggle from tour bar) + dated snapshot export to tours/ folder (well manually) ✅
- Optional waypoint description — missing description currently shows an error; should fail gracefully (show nothing) ✅
- VS Code links in markdown view — filePath should render as a clickable vscode://file/... link in TourMarkdownView, matching the behaviour in the detail panel ✅
- Search/filter bar on graph — graph is getting dense; need a way to find nodes quickly by name so added this, also has a filter by type! ✅
- Alphabetical ordering in tour waypoint picker — make it easier to find waypoints when adding stops to a tour ✅
- Playwright test for docent mode amber bar ✅
- End-to-end docent feature tour ("Building Docent Mode — From Need to Test") ✅
- Playwright test isolation fixed (June 30) — Root cause was db.ts and prisma.config.ts both defaulting to Turso whenever TURSO_DATABASE_URL was present in the environment, regardless of NODE_ENV, meaning local dev and test runs were silently writing to production. Fixed both files to key off NODE_ENV === 'production' explicitly. Added .env.test and a Playwright webServer config pointing to an isolated prisma/test.db. Added afterEach teardown hooks so tests clean up what they create. Confirmed across multiple runs: test.db stays stable in size, dev.db and Turso are both untouched by test runs. ✅ 
- Full map mode added — a view of the entire graph (not scoped to a single 
  tour), using existing type filters; button labels reworked to help the 
  UI tell a clearer story of graph vs. tour vs. full map ✅
- UI polish pass (Sessions 11-12) — app title/tagline added above tour bar; 
  tour control bar contrast improved; markdown/graph view toggle relabeled 
  and made symmetric; landing state and empty right-panel onboarding 
  content added; modal scrolling fixed (tour edit + waypoint edit); 
  markdown view active-stop highlighting and Prev/Next scroll-to-heading; 
  escape key exits tour (yields to modal/input focus first) ✅
- Waypoint panel restructured — Add Waypoint and Filter controls moved into 
  a fixed header inside the panel; panel is now collapsible with an 
  always-visible expand tab, auto-re-expands when switching tours. 
  Resolves the "hide in markdown view" concern differently than planned: 
  rather than force-hiding based on view mode, the user can collapse it 
  themselves when it's not useful, and it comes back automatically when 
  likely needed (tour switch). ✅
- Fixed a bug where the waypoint panel wrongly stayed hidden when 
  returning to full map ✅
- Graph view is now the default (not markdown); persists across tour 
  switches, resets to graph view when returning to full map ✅
- Tour zoom/fit — selecting a tour zooms/pans to fit just that tour's 
  nodes near the top of the screen; returning to full map re-fits to show 
  everything (fixed a min-zoom clamping bug that was clipping nodes) ✅
- Tour title/description given their own non-overlapping row above the 
  graph ✅
- "Next up" narrative (renamed from "Where to next") moved into TourBar as 
  a second row, graph-view only ✅
- Search box moved to a compact top-right overlay on the canvas ✅
- "+ New Tour" ungrouped from the tour dropdown; toolbar button order 
  tidied (Edit tour → New Tour → Markdown View, Export moved far right) ✅
- Markdown view field labels added: "What this is:", "Notes:", "Tour 
  Description:", "Where to next:"/"Next up:"  ✅
- Simplified empty-panel onboarding text ✅
- Bigger/bolder app title and tagline on black header ✅
- New waypoint type: Deprecated (black background, white text) ✅
- Select all / Select none buttons added to the waypoint type filter panel — 
  makes it fast to isolate a single type (e.g. clear all, then check just 
  "Feature" to see the feature map) instead of toggling 7 checkboxes 
  individually. ✅
  - Seed-from-backup script (scripts/seed-from-backup.ts) — refreshes 
  dev.db from a production /api/data backup JSON, clearing and replacing 
  existing local waypoints/edges/tours rather than appending. Guarded the 
  same way db.ts/prisma.config.ts are (explicit NODE_ENV check) — never 
  targets test.db or Turso. Run manually, periodically, not part of the 
  automated test flow. ✅
  - SETUP.md written — instructions for cloning to a separate repo and running an independent instance against your own database/project, so a collaborator can explore freely without touching production ✅
  - Filter panel closes on click-away — clicking outside the panel (e.g. 
  onto blank canvas space) does not currently dismiss it; decided this is 
  fine as-is, since staying open while working the graph with active 
  filters is arguably the better default. Click-away closing may still 
  apply elsewhere (e.g. clicking a different UI element or in the waypoint panel) — worth 
  confirming exact behavior before considering this fully resolved. In progress... but partially done!
  - Stop numbers and waypoint type badges added to markdown view/export — 
  the Edit Tour view now shows each stop's position number (updates live 
  on reorder), and TourMarkdownView/tour-markdown.ts now render each 
  stop's waypoint type alongside label/description, matching what the 
  graph's detail panel already showed ✅
  - Export full map — new "Export full map" button (top-right, full map view 
  only) exports all waypoints as markdown, grouped by type and alphabetical 
  within each group, with waypoint IDs for reference. No narratives or 
  stop numbers, since full map isn't a sequence. Existing tour export 
  button relabeled "Export tour" for clarity. Reuses/extends 
  tour-markdown.ts rather than duplicating export logic. Could serve as a 
  manual backup alongside /api/data, though not yet relied on for that. ✅
  - Layer filter presets — Intent Layer, Technical Layer, and Other buttons 
  added to the waypoint type filter panel, alongside Select all/Select 
  none. Intent Layer: Goal, User Need, Feature, ADR, Test, AI Instruction. 
  Technical Layer: ADR, Code Component, Test, Risk. Other: Open Question, 
  Deprecated. ADR and Test are intentionally dual-layer. Resolves the 
  open question of whether waypoint types map to Triple Debt layers by 
  subject or function ✅
- Filter panel resets on tour load — waypoint type filters clear back to 
  default when switching to a new tour, rather than carrying over a 
  filter state that may not make sense for the newly selected tour ✅
   Tour Controls panel (Phase 1 & 2, Session 14) — new right-hand panel, 
  active only in tour mode (hidden in full map and markdown view), 
  collapsible independently from the waypoint panel. Prev/Next buttons, 
  step indicator, and next-stop commentary moved out of TourBar into this 
  panel. Tour selector, filter, New Tour, Edit tour, Export buttons remain 
  in TourBar. Exit-tour still via Escape or selecting a new tour from the 
  dropdown — no dedicated exit button added. ✅
  - Tour Controls panel completed (Session 14) — linked artifact block added 
  (matches Waypoint panel behavior); description truncates to ~10 lines 
  with "More" (only shown when content actually overflows), notes shown 
  below if space allows, both collapse on stop change; Prev/Next, step 
  indicator, and Exit tour pinned at the top (Exit tour styled red, Next 
  grays out on last stop instead of "Finish"); "Next stop" commentary 
  section restyled amber (was red), moved to bottom of scrollable content; 
  panel widened and title font increased to match Waypoint panel. ✅
- Waypoint panel consistency pass (Session 14) — Edit/Delete/Add Waypoint 
  buttons moved to a pinned row at the top (was bottom); title font size 
  increased to match Tour Controls; "Select a tour to begin understanding, 
  or create a new one" text moved here from TourBar, shown in the 
  "Getting oriented" empty state. ✅
- Tour suspend/resume (Session 14) — selecting a graph node that isn't the 
  current tour stop while a tour is active now suspends the tour (Tour 
  Controls closes gracefully, Waypoint panel opens showing the clicked 
  node) rather than desyncing Tour Controls. A "Resume tour" button in the 
  Waypoint panel returns to the exact stop left off. Exit tour still fully 
  ends the tour during suspension. ✅
- Full map mode cleanup (Session 14) — returning to full map now clears 
  the selected waypoint (shows "Getting oriented" empty state instead of 
  a stale selection). ✅
- Markdown view next-stop commentary recolored red → amber, matching 
  graph view. ✅
- TourBar scope reduced (Session 14) — now handles only tour 
  selector/switcher, + New Tour, waypoint-type Filter, Edit tour, 
  Markdown/Graph toggle, and Export buttons, plus the tour editor popup. 
  Navigation (Prev/Next, step count) and the docent narrative bar moved 
  out into the Tour Controls panel earlier this session; the "select a 
  tour" prompt moved into the Waypoint panel. Waypoint renamed from "TourBar 
  — tour navigation" to "TourBar" to reflect this. ✅

---

### What is NOT yet built
- File content preview in detail panel
- AI-guided waypoint creation
- Export to JSON (a tour/map export format; `/api/data` is only a raw backup)
- Edge deletion via UI (keyboard delete unreliable on Mac)
- Edge detail/edit panel
- Separate Tours tab with independent layout
- Suggest mode for waypoints, waypoint description, tours, tour description and tour stop narration

## Maintenance reminders
- **Backup before onboarding new collaborators** — visit /api/data and 
  save the JSON before giving anyone else access to the live app. Last backup Jul 6, 2026.
- **Update "Last updated" date** at the top of this file each session.
- **Create a waypoint** for any significant new feature or decision before closing a session.
- **Refresh dev.db before auditing.** The audit-waypoints skill only 
  reads local prisma/dev.db, never production/Turso. Before running the 
  skill if you want it checking current production state: (1) visit 
  /api/data on the live app and save the JSON to backups/backup-YYYY-MM-DD.json, 
  (2) run `npx tsx scripts/seed-from-backup.ts backups/backup-YYYY-MM-DD.json` 
  to refresh dev.db, (3) then run /audit-waypoints. Otherwise findings 
  may reflect stale local data, not what's actually live.
  - **Applying a schema migration to production (Turso).** Vercel builds 
  don't run migrations. Before merging a branch with a new migration to 
  `main`: (1) back up /api/data to backups/backup-YYYY-MM-DD.json; 
  (2) `turso db shell <db-name> < prisma/migrations/<new>/migration.sql`; 
  (3) check with `turso db shell <db-name> ".schema Tour"` (or the 
  affected table); (4) merge and push `main`. Apply the migration *before* 
  the deploy, or the new code will query columns that don't exist yet. 
  Run only the new migration's SQL: production already has everything 
  earlier, including `TourWaypoint.narrative`, which was added by hand 
  and only backfilled as a migration file on Sep 24. Locally, never use 
  `prisma db push` on dev.db (it caused that drift); use 
  `npx prisma migrate dev`. test.db is synced with 
  `npx dotenv -e .env.test -- npx prisma db push`.
  - **Rotate any credential immediately if it's ever pasted into chat, docs, commit messages, or committed by mistake** — treat exposure to any external system (including this chat) as equivalent to a real leak. Sequence: generate new → invalidate all → generate final → update Vercel → update local `.env` → redeploy. See known issue below re: confirming redeploy actually triggers.


### Known issues
- Edge deletion via keyboard doesn't work reliably on Mac
- Some tour connections point at wrong nodes (e.g. FileType → CognitiveTourApp should point to the Waypoints feature node instead) — needs a pass to verify across all tours
- **Vercel Git connection can silently disconnect.** If pushes stop triggering deploys (commits show on `origin/main` via `git log`, but nothing new appears in Vercel's Deployments tab), check Project Settings → Git in Vercel. It may show "Connect Git" instead of a connected repo. Fix: reconnect via "Adjust GitHub App Permissions" if the repo isn't listed, then "Connect."
- **No undo and no multi-user conflict protection** — the app has no undo 
  and no locking. With multiple users, concurrent edits can overwrite each 
  other silently. Back up /api/data before collaborative sessions.
  - **Redeploy button doesn't always trigger a build.** Manually clicking "Redeploy" from the Deployments list may not produce a new deployment. Try Redeploy from inside a specific deployment's detail page instead; if that also fails, a trivial no-op commit (even via GitHub's web editor) reliably forces a fresh build.

### Small improvements (quality of life)

- Docent narrative bar hard to see in graph view — contrast/visibility 
  issue noted Session 13, needs investigation (color? size? overlap with 
  graph elements?). Need to play around with this.
  - Rename "Next" button to "Continue tour" in the Tour Controls panel 
  (Session 14, drafted from ChatGPT mockup inspiration, not yet done).


---

## The ontology (waypoint types and their meaning) - note not evaluated

Margaret-Anne's intended ontology — not fully implemented yet:

**Strategic level:**
- **Goal** — the highest level "why" (e.g. "Mitigate and repair cognitive debt") — now implemented as a type ✅
- **User Need** — specific needs that support goals

**Tactical level:**
- **Feature** — capabilities of the tool, can decompose into sub-features
- **Code Component** — implementation artifacts, intended to be hierarchical (high → low level) but currently flat
- **ADR** — architectural decision records, linked to code components
- **Test** — linked to features they validate
- **Risk** — linked to features or ADRs
- **Open Question** — unresolved issues
- **Todo** — work to be done (not yet implemented as a type)

**Intended edge semantics but not enforced:**
- Goal → motivates → User Need
- User Need → supported by → Feature
- Feature → contains → Feature
- Feature → implemented by → Code Component
- Code Component → decomposes into → Code Component
- ADR → leads to → Code Component
- ADR → leads to → Feature (in addition to Code Component, when the ADR's 
  primary motivation is a user-facing capability rather than an 
  implementation detail)
- Test → validates → Feature
- Risk → threatens → Feature or ADR

**Not done**
- **SDR as waypoint type** — Social Decision Records (team/social decisions, 
  analogous to ADRs) may warrant their own type. See Open Question waypoint 
  added June 29. Reference: Team Topologies post by Vanessa Formicola. May not do this.

**Note from tour review (June 16):** not every true relationship needs a graph edge. Some relationships are better expressed in a waypoint's own description/notes than as a separate edge — especially when an edge would point backward through an otherwise linear tour sequence and create a confusing visual knot. Edges are for the map; not every map fact needs to become a tour beat.

**Note on dual-layer types (Session 13 July 7):** ADR and Test both legitimately 
belong to more than one Triple Debt layer (Intent and Technical). This 
isn't an inconsistency, it reflects that these two types sit at the seam 
between why something was built and how it was built. See Layer filter 
presets in "What is built and working" for the concrete implementation.

**Caution:** any file resolving TURSO_DATABASE_URL vs DATABASE_URL must check NODE_ENV explicitly, never just "if Turso var is present," since that variable is always present in .env.
---

## Key decisions made (not in Spec Kit)

- **Not a code analysis tool** — manual curation is intentional. The act of
  creating waypoints and tours IS the cognitive debt repair.
- **Tours you create yourself** are more valuable than prepackaged ones.
  Someone else's tours give the appearance of understanding, not the real thing.
- **AI as scaffold, not substitute** — AI helps you capture your understanding,
  it doesn't generate understanding for you.
- **Not a knowledge graph** — knowledge graphs are about information retrieval.
  Cognitive Tours is about understanding construction. The graph is a scaffold,
  not a deliverable.
- **Web app, not VS Code extension** — tool-agnostic, shareable URL. VS Code
  link is provided as a convenience but the tool doesn't require VS Code.
- **Single user for now** — no auth, no multi-project, no collaboration yet.
- **Turso for cloud, SQLite locally** — Vercel deployment live; Turso provides persistent SQLite across deploys.
- **Tours will move to their own tab** — the main graph is a map for exploration; tours are guided paths. These are different purposes and warrant separate views. Dimming non-tour nodes on the main graph is no longer the desired approach. Tours tab should use Dagre auto-layout (left-to-right or top-to-bottom) rather than manual positioning. But - a counterpoint is that "preserving the users' mental map" is also key... so not working on this for now!
- **Waypoint content must be context-free.** A waypoint's description/notes should make sense regardless of which tour (or no tour) brought a reader to it. Tour-specific transition narrative ("now that you've seen X, let's look at Y") does not belong in waypoint notes — it contaminates the waypoint for every other entry point. For now, if a transition insight is worth keeping, prefer rephrasing it as a standalone true fact about the waypoint itself, or hold it in the tour's own description field as a stopgap. 
- **Tours as markdown.** Using live-render for a tour's markdown versus archived snapshot and the markodwn view is toggled from the tour bar.
-  **Markdown view is read-focused, no waypoint selection.** Unlike graph 
  view, clicking a stop in markdown view doesn't select the waypoint or 
  populate the right panel. Left as-is for now (July 6) — could be added 
  later if markdown view needs to support inspection/editing, not just 
  reading.
  - **Seed script and audit skill are kept separate, not merged.** The 
  seed-from-backup script (scripts/seed-from-backup.ts) is a destructive 
  write operation — it wipes and replaces dev.db from a production 
  backup. The audit-waypoints skill is strictly read-only by design (see 
  above). Merging them would mean one command sometimes writes and 
  sometimes only reads, which undermines the "always safe to run" trust 
  the audit skill was specifically redesigned to earn. Workflow: run the 
  seed script first (deliberately, when dev.db needs to catch up to 
  production), then run the audit skill separately afterward to check 
  freshness against whatever's now local.
  - **"Bridge" vs "Next" terminology still unresolved** (open since Session 
  11, resurfaced Session 14). Decide before touching more surfaces that 
  reference next-stop commentary.

---

## Constitution (8 principles — v1.3.0)

I. Simplicity Over Complexity — YAGNI enforced
II. Incremental Growth — one small verifiable step at a time
III. Intent Before Implementation — spec before code
IV. Clean Readable TypeScript — strict mode, no any
V. Minimal Clear UI — every element earns its place
VI. Waypoints and Tours are Universal — not just for code
VII. Flexible Navigation — code, intent, or both
VIII. Human and Agent Readable — every waypoint meaningful to humans AND agents

Full constitution: .specify/memory/constitution.md

---

## Research connections

- **Triple Debt paper** — cognitive debt + intent debt + technical debt
- **TagSEA** (2006) — predecessor, waypoints and routes in Eclipse
- **Tours Eclipse plugin** (2006) — direct ancestor of tour concept
- **Russ Miles** — diagnostic legibility, chaos engineering (student collaboration)
- **Cat Hicks** — learning science, developer psychology (potential collaborator)
- **DORA team** — practitioner reach, industry validation (in progress)
- **Rahul Garg / Lattice** — complementary tool (Martin Fowler contributor, engaged on LinkedIn)
- **Cognitive Tours paper** — in early planning, targeting NIER or CHASE track at ICSE (deadline TBD)
- **Missing Stop Sign blog post** (June 9, margaretstorey.com) — intent debt explained via the out-of-town-driver metaphor; first in a series
- **LACY - cognitive tours for onboarding**, to be presented at FSE 2026. Focused on code, semi-automated. See [here](https://arxiv.org/pdf/2603.25391)
- **Narrative driven development** https://specdriven.com/dialects/narrative-driven 
- **SDR** - social decision records from Team Topologies see [here](https://teamtopologies.com/news-blogs-newsletters/social-decision-records-and-team-apis-documenting-human-interactions-for-better-collaboration) 
- **CodeMap** presented at ICPC 2026, see [here](https://arxiv.org/html/2504.04553v3)
- See also [this] (scriptbyai.com/claude-code-resource-list/) 


---

  ## What to work on next (in priority order)

  - Architecture tour missing a stop for Tour Control Panel (Session 14) — 
  needs a stop covering it, likely inserted after CognitiveToursApp or 
  after TourBar, once audit-tours (or a manual pass) confirms full scope.

  - **`audit-tours` skill (new, not yet built)** — Session 14 surfaced that 
  `audit-waypoints` (per-node accuracy) has no counterpart for tour-level 
  coherence. When a component moves or is restructured (e.g. today's move 
  of docent's amber bar from TourBar into Tour Control Panel), tour 
  bridges and edges can go stale silently — nothing currently flags this, 
  a human has to happen to re-read the tour and notice. Concretely hit 
  tonight: a stale "implemented by" edge, a bridge still referencing a 
  component's old location, and a missing stop for a component that had 
  grown significantly (Tour Control Panel absent from the Architecture 
  tour despite being a first-class piece of CognitiveToursApp.tsx now).

  Scope for a first version, read-only like audit-waypoints, one finding 
  at a time:
    - Flag bridge text that references a specific UI location/component 
      by name, cross-check against where that thing's waypoint says it 
      currently lives.
    - Flag edges that create redundant paths to the same waypoint (e.g. 
      two different ancestors both leading to the same node via 
      "contains", when one is now transitive through the other).
    - Flag bridges that closely duplicate their own target waypoint's 
      description (a heuristic that the bridge isn't actually bridging).
    - Possibly: flag components with substantial recent changes (many 
      new sub-features, moved responsibilities) that don't yet appear as 
      a stop in any tour that should logically include them — likely the 
      hardest to automate well, may stay a manual check.

  Rewriting bridge prose and deciding a tour's shape stays a human task 
  either way — this tool would only be for surfacing drift, not fixing 
  it, consistent with audit-waypoints' philosophy of factual drift 
  reporting, not auto-correction.

  - Turso ADR tour ("Choosing a Database That Works in Production") has a 
  stale/incorrect bridge on the db.ts stop — was describing the old, 
  buggy TURSO_DATABASE_URL-presence check rather than the current 
  NODE_ENV check. Fixed Session 14. Stops 2-4 still have heavy 
  redundancy (description + aside + bridge repeating the same fact 
  3-4 times) — cosmetic, worth a cleanup pass, not urgent.
- Noticed several tours (Docent Mode, Turso ADR) with layered, repetitive 
  content in descriptions (multiple "Note:"/"History:"/"Update:" asides 
  saying the same thing) — unclear if from manual editing over multiple 
  sessions or something else. Worth keeping an eye on whether content 
  appears in waypoints without having been manually written — flagged 
  Session 14, unresolved.

  1. **Merge Waypoint panel + Tour Controls panel into one** — a ChatGPT 
    mockup (Session 14) showed a single consolidated right panel (tour 
    context, current stop, commentary, "what to notice" bullets, linked 
    artifacts as chips) rather than two side-by-side panels. Open 
    decision: merge now, or keep developing Tour Controls separately a 
    while longer first. If pursuing "what to notice" bullets, decide 
    whether this needs a new data model field on waypoints/tour stops, 
    or is just an authoring convention on existing fields.

3. **Compass icon** — small ring + needle SVG, add next to app title. 
   Markup ready (see session notes); needs Claude Code to place it and 
   decide favicon vs. header-only vs. both.

4. **Manual tour rewrite pass** — existing tours' narrative fields mostly 
   restate the waypoint's own description rather than bridging between 
   stops. Two tours ("Choosing a Database", "Building Docent Mode") 
   already do this well and can serve as the template. Rewriting the rest 
   is a manual, hands-on pass (not delegated) — intentional, to build the 
   habit. [not a code task but update to DB only]

5. **AI suggest feature** — "Suggest" button on waypoint description and 
   tour stop narrative fields. Deferred — may interfere with pedagogical 
   goals for Fall course; unresolved question of whether AI-generated 
   waypoints/narratives undermine the understanding-building the tool 
   exists to support. [use speckit]

6. **Edge management panel** — show edge details in right panel, delete 
   button there. Currently double-click to delete (not intuitive). [use speckit]

7. **Tour and waypoint metadata** — add author (manual text field) and 
   updatedAt (auto-timestamp via Prisma @updatedAt) to both the Tour and 
   Waypoint models. Display tour metadata in markdown view and export 
   header; waypoint metadata in the detail panel. Coordinate with item 9: 
   spec 009's self-reported authorName (localStorage) should populate this 
   same author field rather than introducing a second one. 
   [probably don't need speckit]

8. **Tour entry UX — design direction (not yet built)** — [keep existing 
   text as-is] - but better home page needed and product page

9. **Multi-team support for Startup Studio (Fall 2026)** — see spec 009 
   draft. One link per team (no login), self-reported authorName via 
   localStorage, instructor overview page. Estimated 5-6 sessions, 
   targeted for August. Not urgent yet but has a real external deadline 
   (course starts September). [use speckit]

10. **Persistent tours-list panel** (Session 14, inspired by ChatGPT mockup) 
  — replace the tour-selector dropdown with a dedicated left-side panel 
  listing all tours (mirrors the mockup's TOURS list), with a separate 
  "Full Map" control rather than folding full map into the same dropdown. 
  Open questions: collapsible or always visible; does it coexist with the 
  dropdown during transition or replace it outright; layout impact of a 
  third panel (graph now flanked left and right).

11. **Tour-specific auto-layout** (Session 14) — tours currently reuse each 
  waypoint's manually-set full-map position, which can make a tour's path 
  visually incoherent since stops may be scattered wherever they landed 
  in the full map. Consider Dagre auto-layout (left-to-right or 
  top-to-bottom) applied only as a temporary view-time rearrangement when 
  viewing a tour, without overwriting the stored manual positions — 
  preserves the curated full-map mental map while giving tours a cleaner 
  path. Ties into the existing "Tours will move to their own tab" idea 
  already in Key Decisions.


---

## What Margaret-Anne is confused about

- How to keep waypoints and tours in sync as the code evolves (partially solved with the backup script/audit skill)
- How the cognitive layer (this document + the app's waypoints) connects to
  the intent layer (Spec Kit) and technical layer (code) in a sustainable way (partially addressed but still requires a lot of manual work but then it is tool such as speckit agnostic)
- See also open questions in the Cognitive Tours db! 

---


## Stack reference

```
app/
  components/
    CognitiveToursApp.tsx — root state, all mutation handlers, Tour Controls panel
    WaypointGraph.tsx  — React Flow canvas (left panel)
    WaypointDetail.tsx — selected waypoint detail (right panel)
    TourBar.tsx        — tour selector, New Tour, Filter, Edit tour, markdown/graph toggle, Export, tour editor (top bar)
    TourMarkdownView.tsx — read-focused markdown rendering of a tour
    WaypointForm.tsx   — create/edit modal
  lib/
    types.ts           — TypeScript interfaces (source of truth)
    db.ts              — database client (Turso in production, local SQLite in dev)
    db-mappers.ts      — Prisma rows → AppState types
    mock-data.ts       — seed data (used only on first DB run)
  api/
    data/route.ts      — GET bulk load + seed
    waypoints/         — POST create, PUT/DELETE by id
    edges/             — POST create, DELETE by id
    tours/             — POST create, PUT/DELETE by id
prisma/
  schema.prisma        — DB schema (Waypoint, Edge, Tour, TourWaypoint)
  dev.db               — SQLite database (gitignored)
tests/                 — Playwright tests (isolated prisma/test.db)
scripts/
  seed-from-backup.ts  — refresh dev.db from a production /api/data backup
.specify/
  memory/constitution.md — 8 principles
specs/                 — Spec Kit feature specs
docs/adr/              — Architectural Decision Records 
```
<!-- COGNITIVE LAYER END -->

<!-- bram:start -->
@.claude/bram-conventions.md
<!-- bram:end -->
