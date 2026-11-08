@AGENTS.md
Last updated: November 7 2026

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
- Tour stop focus (Oct 20) — during a tour the camera follows the current 
  stop: selecting a tour, Next, Prev and Resume center it at a readable 
  zoom (at least 1.0, at most 1.5); node positions never change. 
  Spotlight: current stop scaled 1.2× with a heavier ring/glow and drawn 
  on top, other stops at 85% opacity (50% until Oct 21; raised so tours 
  print clearly), non-tour nodes at 20%. "Show whole 
  tour" in Tour Controls switches to the fit-all-stops view ("Back to 
  stop" returns); stepping always returns to following. Note this 
  replaces "selecting a tour fits the whole tour" above: the whole-tour 
  fit is now the overview toggle ✅
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
  - Filter panel closes on click-away — any click outside the panel now 
  dismisses it, including on the graph canvas, nodes and edges (Oct 20; 
  reverses the earlier "fine as-is" call after testing as a student). 
  The canvas case had silently failed because React Flow's pan/zoom stops 
  `mousedown` bubbling; the listener in TourBar.tsx now uses a 
  capture-phase `pointerdown`. Covered by a Playwright test ✅
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
- New waypoints appear where the cursor last was on the map (Oct 27), 
  replacing the Jul 8 top-right-of-the-map placement, which landed 
  off-screen once you'd zoomed or panned. The position is taken when 
  the form opens. From the canvas's + Add Waypoint it goes just below 
  the button; if the cursor never came over the map, mid-view; always 
  inside the visible map. Several in a row stack in a column instead 
  of on top of each other. Markdown view and the empty-map screen keep 
  the old placement. Covered by a Playwright test ✅
- Tour Controls text one more size larger (Nov 3), for projecting and 
  the demo video: every size in the panel stepped up together (stop 
  title text-lg, body and buttons text-base, small print text-sm), 
  after the Oct 21 step. Panel width unchanged; the Prev/Next/Exit row 
  still fits on one line ✅
- Double-click a waypoint on the graph to edit it (Nov 4): it opens 
  the same form as Edit in the Waypoint panel (`onNodeDoubleClick` in 
  WaypointGraph.tsx). Nodes carry React Flow's `nopan` class, so the 
  double-click no longer zooms in; double-clicking empty canvas still 
  does. During a tour, the first click still suspends the tour as 
  before, and Resume tour works after the form closes. Covered by a 
  Playwright test ✅
- New waypoint, edge and tour ids get a random ending (Nov 5; 
  `newId()` in CognitiveToursApp.tsx). They were the bare millisecond 
  (`w-${Date.now()}`), so two saves in the same millisecond got the 
  same id; the server refused the second and the app quietly removed 
  it from the map ("Failed to save waypoint."). Found because parallel 
  test runs hit it about 1 in 6; two people on one team site could 
  too. Existing ids are unchanged ✅
- Tour editor shows where each bridge leads (Nov 5; TourBar.tsx). Each 
  stop's narrative box is headed "→ to stop N+1: <label>" (the last 
  stop's reads "Closing words (optional)") and updates on reorder; a 
  "Show description" toggle on each stop shows the waypoint's 
  description, read-only, while you write. Each stop has its type's 
  colour as a chip and a left border; markdown view shows the same 
  chip (exports stay plain text). Narrative data is unchanged. Covered 
  by a Playwright test ✅
- An icon per waypoint type (Nov 5; `app/lib/waypoint-icons.tsx`, 
  `lucide-react` pinned at 0.460.0), so types can be told apart without 
  colour (colour-blind readers, black-and-white printouts). Goal Flag, 
  User Need User, Feature Puzzle, ADR Scale, Code Component Code, Test 
  FlaskConical, Risk TriangleAlert, AI Instruction Bot, Open Question 
  CircleHelp, Deprecated Archive. Shown beside the type name, never 
  instead of it: on graph nodes (14px; node size unchanged, the user's 
  pick from a mockup of three placements), the detail panel badge, the 
  type filter (so it doubles as a legend), and the type chips in Edit 
  tour and markdown view. Icons are `aria-hidden`; exports stay plain 
  text. Covered by a Playwright test ✅
- No blank page on an unfamiliar repo (Nov 5): a `/first-tours` skill 
  (now `plugins/cognitive-tours/skills/first-tours/SKILL.md`) reads the local checkout and 
  adds a **starting map** to the site: about 12–15 waypoints with 
  short descriptions, a few edges, and two tours of at most 8 stops 
  each, the user's view and the builder's view (which doubles as the 
  architecture overview), sharing a Feature where intent meets code. 
  It's for getting to know a repo you didn't write; you then rewrite 
  and extend the map as your understanding grows. **A deliberate 
  exception to "tours you create yourself" and to the read-only 
  suggest skills**: it shows the plan and writes only after one OK, 
  through the site's API (asking for the edit passcode on a 401), 
  never edits or deletes what's there, and marks every waypoint's 
  Notes "Drafted by Claude from the repo, <date>: a starting point, 
  not yet checked by a person" and each tour's author "Claude 
  (first-tours)". Where the repo doesn't say why, it adds an Open 
  Question instead of inventing an answer. Self-contained (no reliance 
  on this repo's CLAUDE.md or `.env`), so it runs in any repo from 
  `~/.claude/skills/`. The empty map shows a "Don't start 
  from a blank page" card under Add first waypoint, with a Copy 
  command button for `/cognitive-tours:first-tours site <this site>` 
  (the plugin's name for it, since Nov 5): a web page can't run a 
  skill, so it hands over the command with its own address. Covered by 
  Playwright tests ✅
- **The skills are a Claude Code plugin** (Nov 5), so students and 
  anyone else can use them in their own repos: 
  `/plugin install cognitive-tours --marketplace 
  margaretstorey/cognitive-tours` (this repo is the marketplace: 
  `.claude-plugin/marketplace.json` → `plugins/cognitive-tours/`, v0.1.0). 
  All five ship: first-tours, suggest-waypoint, suggest-tour, 
  audit-waypoints and audit-tours, typed as 
  `/cognitive-tours:<skill>`. **One copy of each:** the files live in 
  `plugins/cognitive-tours/skills/`, and each `.claude/skills/<name>/SKILL.md` 
  here is a symlink to it, so the short names still work in this repo 
  (a symlinked *folder* breaks Bram's commit snapshot: "Unable to hash 
  (null)"). Edit them 
  in the plugin folder and bump the version in both manifests when 
  they change. **No `.env` any more:** each skill finds its site from 
  `site <url>`, else a `Cognitive Tours site: <url>` line in the repo's 
  `CLAUDE.local.md` (or `CLAUDE.md`), else asks and offers to save that 
  line, only into a `CLAUDE.local.md` that git ignores. This repo's 
  line is in `CLAUDE.local.md`. The edge vocabulary is written into the 
  skills instead of read from this file. Docs: README "Skills for 
  Claude Code" and `docs/GETTING-STARTED.md` §3 ✅
- **A "Claude Code skills" button on every site** (Nov 5; 
  `app/components/ClaudeCodePanel.tsx`), pinned right in the header 
  opposite the Project pill. It opens a panel with the plugin's install 
  command and each skill's command with this site's address filled in 
  (`/cognitive-tours:<skill> site <origin>`), each with a Copy button, 
  so nobody has to find the address or type a command. first-tours is 
  marked "meant for an empty map" when the map isn't. Escape closes it 
  without leaving an active tour. The empty-map card shares its Copy 
  control (`CopyCommand`). Covered by Playwright tests ✅
- **Visitor counts on every site** (Nov 7): Vercel Web Analytics 
  (`@vercel/analytics` pinned at 2.0.1, `<Analytics />` in 
  `app/layout.tsx`). A site counts only once its Vercel project's 
  **Analytics** tab is **Enabled**, and only from that day; the numbers 
  (visitors, page views, referrers, countries) are on that tab. 
  Cookieless, no IP addresses or personal data kept. Added so the user can 
  see how many people try the demo. The user's decision (Nov 7): it's on 
  all sites, and visits to student and team sites are not used as 
  research data ✅
- **A "Start here" walkthrough on every site** (Nov 7; 
  `app/components/StartHere.tsx`), after floorplan's one-minute intro. 
  Four steps on a map with tours (the map; the tour selector; Tour 
  Controls, for which it starts the first tour and leaves it running; 
  making your own), two on an empty map. Each step rings its target 
  (found by `data-start-here="map" | "tour-controls" | "skills"` or 
  `#tour-select`) and dims the rest. It opens on a browser's first 
  visit to a site (localStorage `cognitive-tours:start-here-seen`) and 
  replays from the **Start here** header button; Skip, Done or Escape 
  closes it, and Escape never leaves an active tour (capture phase, as 
  the skills panel). The header's right-hand button group must not use 
  a CSS transform: it would position both fixed overlays relative to 
  it. `tests/basic.spec.ts` marks it seen before every test; 
  `tests/start-here.spec.ts` covers it ✅

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
- **Back up every site** — run `npx tsx scripts/backup-all-sites.ts` 
  before each class session, before any migration, and before giving 
  anyone new access. It's read-only: it saves each site's /api/data to 
  backups/backup-YYYY-MM-DD.json (yours, committed) or 
  backups/teams/<team>-YYYY-MM-DD.json (gitignored). Turso's own 
  point-in-time restore only reaches back 1 day on the current plan 
  (10 on Developer), so these files are the longer-term safety net.
  **Plans (as of Nov 4):** **Vercel Pro** (team 
  `margaret-anne-storey-s-projects`, since about Oct 22), so all 19 
  sites can deploy on every push. **Turso Starter** (free), kept on 
  purpose: 19 of 100 databases used, 1-day point-in-time restore, with 
  these backup files and the nightly Blob backups as the longer safety 
  net; Developer ($4.99/month) would give 10 days if ever wanted. 
  Turso's "locations" reads 5 of 3 (over its limit, overages disabled), 
  so far without effect: if creating a database ever fails, check this 
  first.
  **Nightly, automatically:** a Vercel cron (`vercel.json` → 
  `/api/backup-nightly`, ~3 a.m. Pacific) saves every site to the private 
  Blob store `cognitive-tours-backups`, under `nightly/YYYY-MM-DD/<site>.json` 
  (`mine.json` is yours). Get one from your team's page on Vercel 
  (margaret-anne-storey-s-projects, not inside a project: stores belong 
  to the team) → **Storage** in the left sidebar → cognitive-tours-backups 
  → Browser, directly at 
  https://vercel.com/margaret-anne-storey-s-projects/~/stores/blob/store_kEY392RuLzkDcRkA, 
  or `vercel blob list`. It runs only 
  on cognitive-tours (`BACKUP_ALL_SITES=true`, plus `CRON_SECRET`); the 
  team projects get the cron but it does nothing there. Check its logs 
  in Vercel if a night's folder is missing.
- **Restoring a site from a backup:** follow `docs/RESTORE.md` ("If 
  something goes wrong"). It covers the demo reset, student sites, your 
  own map and nightly backups, and what was tested (Nov 3: Turso rolls 
  back a failed restore; the demo was messed up and restored exactly). 
  The tool is `scripts/restore-production-from-backup.ts`: it writes a 
  SQL file and changes nothing; you run that file with `turso db shell`.
- **Update "Last updated" date** at the top of this file each session.
- **Create a waypoint** for any significant new feature or decision before closing a session. 
  Run `/suggest-waypoint`, then `/suggest-tour`: they find what's worth 
  recording (decisions first) and ask questions while you write it. 
  Also useful any time you suspect work went unrecorded 
  (`/suggest-waypoint since YYYY-MM-DD`).
- **Auditing reads the live site.** /audit-waypoints and /audit-tours 
  both read the site's /api/data directly (GET only; pass `site <url>` 
  for a team's site), so there's no dev.db refresh step. 
  `scripts/seed-from-backup.ts` is still how to refresh local dev data.
  - **Applying a schema migration to production (Turso).** Vercel builds 
  don't run migrations. Before merging a branch with a new migration to 
  `main`: (0) sign in to the Turso CLI with `turso auth login`, using 
  your **personal** Turso account (not the UVic one; the address is in 
  `CLAUDE.local.md`), then 
  `turso db list` to get `<db-name>` (currently `cognitive-tours`); 
  (1) back up **every site** with `npx tsx scripts/backup-all-sites.ts` 
  (yours to backups/backup-YYYY-MM-DD.json, teams' to 
  backups/teams/<team>-YYYY-MM-DD.json); 
  (2) run the migration on **every database**, stopping at the first 
  failure. The list comes from `SITE_NAMES` in `.env` (yours is 
  `cognitive-tours`, every other site's is `ct-<name>`; the full list is 
  in `CLAUDE.local.md`):
  ```
  for db in cognitive-tours $(grep '^SITE_NAMES=' .env | cut -d= -f2 | tr ',' '\n' | sed 's/^/ct-/'); do
    echo "== $db"; turso db shell "$db" < prisma/migrations/<new>/migration.sql || break
  done
  ```
  (3) check each with the same loop running `turso db shell "$db" 
  ".schema Tour"` (or the affected table); (4) merge and push `main`, 
  which deploys your own site, then release to `stable` (below) so 
  the other 18 get the new code too; never remove or rename a column 
  without releasing first, since `stable` sites run older code on the 
  new schema until then. Apply the migration *before* 
  the deploy, or the new code will query columns that don't exist yet. 
  Run only the new migration's SQL: production already has everything 
  earlier, including `TourWaypoint.narrative`, which was added by hand 
  and only backfilled as a migration file on Sep 24. Locally, never use 
  `prisma db push` on dev.db (it caused that drift); use 
  `npx prisma migrate dev`. test.db is synced with 
  `npx dotenv -e .env.test -- npx prisma db push`.
  - **Team sites (Fall 2026 Startup Studio).** Each team has its own 
  Vercel project and Turso database, all deploying from this repo's 
  `stable` branch (since Nov 7, below); only the env vars differ. Your own site is untouched.

  **Two branches, `main` and `stable`** (Nov 7). Only your own site 
  (cognitive-tours) deploys from `main`, so it shows every change as you 
  work. The other 18 (demo, demo-flask, the team sites, Sandbox 1–9) 
  deploy from `stable` (each project's Settings → Git → Production 
  Branch), so the demo the ICSE paper and LinkedIn link 
  (`https://cognitive-tours-demo.vercel.app/`), students' sites and 
  people trying the sandboxes never see half-finished work. **Releasing** 
  is a deliberate step: `git push origin main:stable` (a fast-forward; 
  never commit to `stable` directly), then check the 18 Deployments tabs. 
  The 18 build nothing but `stable`: each has the Ignored Build Step 
  `[ "$VERCEL_GIT_COMMIT_REF" != "stable" ]` (Settings → Build and 
  Deployment; Nov 7, after previews of `main` showed 18 failed checks on 
  GitHub, failing by design because their database settings are 
  Production-only). So a red X on `main` means your own site's build 
  failed. **A new team site needs the same setting** and Production 
  Branch `stable`. The demo's hourly reset uses the 
  `demo-canonical.json` bundled into `stable`'s build, so a refreshed 
  copy reaches the demo only when released. Chosen over forking the 
  repo (two repos, marketplaces and backup setups to keep in step).

  **The team sites aren't listed in the repo** (Nov 4): a site's address 
  is `cognitive-tours-<name>.vercel.app` and the sites have no login, so 
  a public copy must not list every student map. The names live in the 
  server-only `SITE_NAMES` setting (comma-separated), in your `.env` and 
  in the cognitive-tours Vercel project (for the nightly backup), read by 
  `getSites()` in `app/lib/sites.ts`. The full table (every site, Vercel 
  project, database and setting) is in **`CLAUDE.local.md`**, which git 
  ignores and Claude Code reads locally. The public ones:

  | Site | Vercel project | Turso database | NEXT_PUBLIC_PROJECT_NAME | NEXT_PUBLIC_REPO_URL |
  |---|---|---|---|---|
  | Mine (edit passcode; header `#0f4c5c`) | cognitive-tours (address in `MY_SITE_URL`) | cognitive-tours | Cognitive Tours Repo | https://github.com/margaretstorey/cognitive-tours |
  | Demo (public, copy of your map) | cognitive-tours-demo | ct-demo | Cognitive Tours (demo) | https://github.com/margaretstorey/cognitive-tours |
  | Demo, Flask (public, brownfield) | cognitive-tours-demo-flask | ct-demo-flask | Flask (demo) | https://github.com/margaretstorey/flask |
  | Sandbox 1 … Sandbox 9 (public, blank, to try authoring) | cognitive-tours-sandbox1 … sandbox9 | ct-sandbox1 … ct-sandbox9 | Sandbox 1 … Sandbox 9 | (unset) |

  **Your own site's address is read from `MY_SITE_URL`** (Nov 3), in 
  your local `.env` and in the cognitive-tours Vercel project 
  (server-only, no `NEXT_PUBLIC_`), by `app/lib/sites.ts`, the backup 
  script and the nightly backup (the skills read it until Nov 5; they 
  now use the `Cognitive Tours site:` line in `CLAUDE.local.md`). 
  **Correction (Nov 4):** the Nov 3 note that the site "was moved to a 
  hard-to-guess `cognitive-tours-<random>.vercel.app`" was wrong. The 
  project only ever served the well-known `cognitive-tours.vercel.app` 
  (checked through the Vercel API), and `MY_SITE_URL` was missing from 
  the Vercel project until Nov 4, so the nightly backup had skipped your 
  map. **Your map is protected by an edit passcode instead** (Nov 4): the 
  server-only `EDIT_PASSCODE` on the cognitive-tours project. Every add, 
  edit and delete needs it in the `x-edit-passcode` header 
  (`app/lib/edit-passcode.ts`, checked in all eight write handlers under 
  `app/api/`); the app asks once per browser and remembers it. Reading 
  stays open, so backups, the nightly jobs, the skills and the restore 
  tool (which writes through `turso db shell`) are unaffected. **Since 
  Nov 5 the team sites set it too** (Test, Finito, Vitalitree, Evernear, 
  Elevate, Poold, Ciara), all to one shared team passcode (in 
  `CLAUDE.local.md`), the user's choice for an MVP: reading stays open, 
  so teams can read each other's maps, and that's fine for now. A team 
  that wants its own gets one by changing that project's setting and 
  redeploying. Demo, demo-flask and the sandboxes stay open on purpose. 
  **Adding a team** now includes setting `EDIT_PASSCODE` (step in 
  `CLAUDE.local.md`). No passcode is ever written in the repo. To 
  hide the map from readers too, the next step would be Vercel 
  Authentication (free on Pro) plus a protection bypass for the scripts, 
  nightly jobs and skills.

  The Demo site (Oct 22) is the public demo for the ICSE 2027 demo 
  paper and for letting others try the tool, so they never edit your 
  own map. **Since Nov 4 it holds a cleaned copy of your own map**, 
  matching the paper (§IV: "A Research Story Behind Cognitive Tours" 
  on this URL) and the demo video. In the copy, file paths are kept and 
  link to this repo (`NEXT_PUBLIC_REPO_URL`), to show the file-link 
  features; **they 404 until the repo is public**, and if a cleaned 
  snapshot is published as a new repo instead, point 
  `NEXT_PUBLIC_REPO_URL` at it and redeploy the demo. Your private site 
  address and the student site addresses are taken out, and the deleted Open Question 
  "Should waypoint types be configurable rather than hardcoded?" is put 
  back as Research Story's stop 10, from `backups/backup-2026-10-23b.json` 
  (your own map still needs it back). Tours keep their original 
  authors and dates. To refresh the copy later, redo it from a fresh 
  backup with the same clean-up, then check the copy for the private 
  address, `vercel.app` and team site names before loading it. Until 
  Nov 4 the demo toured the user's fork of Flask (cloned at `~/flask`; 
  `docs/design.rst` is the source for ADR waypoints). **That map now 
  has its own site, demo-flask** (Nov 4), with `backups/demo-flask.json` 
  as its reset copy (`scripts/restore-production-from-backup.ts 
  backups/demo-flask.json demo-flask`). **Sandbox 1 to Sandbox 9** (Nov 4; first made as demo1–9 and
  recreated under these names the same day) are blank sites (`SEED_ON_EMPTY=false`) for people to try writing 
  waypoints and tours; they never reset (empty one by restoring an
  empty backup). All ten 
  are in `SITE_NAMES`, so they're backed up and migrated with the rest: 
  every release builds 19 sites (`main` your own, `stable` the other 18). Anyone can edit the demo, so back it 
  up before sharing the link; resetting it means restoring 
  `backups/demo-canonical.json` (see "Restoring a site from a backup" 
  above).

  Team projects set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, 
  `SEED_ON_EMPTY=false` (a new team starts with an empty map instead of 
  the self-documentation seed) and `NEXT_PUBLIC_PROJECT_NAME` (shown as 
  a "Project:" pill in the header, in the tab title and in exports and 
  their filenames; baked in at build time, so changing it needs a 
  redeploy). Sites are at `<vercel project>.vercel.app`. 
  `NEXT_PUBLIC_REPO_URL` (optional, e.g. 
  `https://github.com/acme-startup/acme`) gives every file link a 
  "View on GitHub" and makes the Project label link to the repo; when 
  it's unset, any student can set it for their own browser from the 
  waypoint panel ("Set your team's GitHub repo"), which is the plan for 
  now. Two more optional settings make a site easy to tell apart (Nov 4; 
  both baked in at build time, so changing one needs a redeploy): 
  `NEXT_PUBLIC_SITE_NOTICE`, a line of text under the header title, and 
  `NEXT_PUBLIC_SITE_COLOR`, the header's background as a hex colour 
  (anything else is ignored; keep it dark, the text is white). The demo 
  and demo-flask use dark red `#7f1d1d` with "Demonstration site: … 
  Anyone can edit it; changes may be lost."; the sandboxes use dark blue 
  `#1e3a8a` with "Sandbox: try writing waypoints and tours. …". Team sites and your own site set neither (black header). 
  **The main demo resets itself every hour, on the hour** (nightly from 
  Nov 4, hourly since Nov 7 because visitors from the paper and LinkedIn 
  rearranged it during the day; only that one, by the user's choice): a 
  second cron (`vercel.json` → `/api/reset-nightly`, `0 * * * *`; the 
  route keeps its old name) 
  replaces the whole map on a site that sets `RESET_NIGHTLY_FROM` **and** 
  whose `NEXT_PUBLIC_PROJECT_NAME` contains the word "demo"; it also needs 
  that project's `CRON_SECRET`. Only cognitive-tours-demo sets them 
  (`RESET_NIGHTLY_FROM=demo-canonical`), so it goes back to the committed 
  `backups/demo-canonical.json`, bundled at build time: refreshing that 
  file and pushing changes what the next reset puts back. demo-flask and 
  the blank sites don't reset (they could opt in with `demo-flask` or 
  `empty`); team sites and your own site never do, and the route does 
  nothing there (204). Check a night's run in the demo's Vercel logs 
  (`nightlyReset`). Only the main demo's notice promises a reset; the 
  others say "changes may be lost". **How changes reach every site:** 
  code: a push to `main` deploys your own site, and a release 
  (`git push origin main:stable`) the other 18; afterwards, check each 
  project's Deployments tab for the new build (see the Vercel Git 
  disconnect known issue). Schema: the migration loop above, never just 
  `cognitive-tours`. Backups: each site's `/api/data`, with team 
  backups in `backups/teams/` (gitignored, so student work never lands 
  in the repo). **Adding a team:** add its name to `SITE_NAMES` in 
  `.env` *and* in the cognitive-tours Vercel project (then redeploy 
  cognitive-tours so the nightly backup sees it), and add its row to the 
  table in `CLAUDE.local.md`. The migration loop and the backup and 
  restore scripts pick it up from `SITE_NAMES`. If `SITE_NAMES` is 
  missing, the backup script and the nightly backup stop with an error 
  rather than back up fewer sites.
  - **Rotate any credential immediately if it's ever pasted into chat, docs, commit messages, or committed by mistake** — treat exposure to any external system (including this chat) as equivalent to a real leak. Sequence: generate new → invalidate all → generate final → update Vercel → update local `.env` → redeploy. See known issue below re: confirming redeploy actually triggers.


### Known issues
- Edge deletion via keyboard doesn't work reliably on Mac
- **Double-click means edit on a node but delete on an edge** (Nov 4). 
  Double-clicking an edge deletes it at once, with no confirmation 
  (`onEdgeDoubleClick` in WaypointGraph.tsx), so a double-click that 
  misses a node by a few pixels can delete an edge. Asking first, or 
  moving edge deletion into an edge panel (What to work on next, item 
  6), would fix it.
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
  the audit skill was specifically redesigned to earn. (Since Oct 21 
  the audit skills read the live site's /api/data, not dev.db, so 
  they no longer depend on the seed script at all.)
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
- **Habitat engineering** — Russ Miles, *The Sovereign Engineer*, and the AI Literacy Superpowers plugin: environments that make good AI output the default (related; intent for the agent)
- **Lattice** — Rahul Garg's open-source skills for AI coding assistants, from his martinfowler.com series on reducing friction in AI-assisted development (related; context for the agent)
- **SpecStory** — saves AI coding conversations as Markdown ("Intent is the new source code"); captures intent automatically, without curation
- **/grill-me** (Matt Pocock) — a Claude Code skill where the AI interviews you about a plan before writing code; questions first, like the suggest skills, but for the agent's benefit
- **DeepWiki, Google Code Wiki** — AI-generated repository wikis, the opposite approach (AI writes the understanding)
- **ICSE 2027 demo paper** — *Cognitive Tours: Making Understanding a Team Deliverable in AI-Assisted Development*, under review: `docs/papers/icse2027demo.pdf`. Changes planned for the arXiv version: Worklist `reminder-arxiv-revision`
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

  - **`audit-tours` skill — v1 built (Oct 21)** at 
  `.claude/skills/audit-tours/SKILL.md`; run `/audit-tours since 
  YYYY-MM-DD`. Read-only; reads the site's /api/data (not dev.db). 
  Covers: which recently changed files have no waypoint or are in no 
  tour (Coverage), stale bridges, bridges that don't bridge or point 
  at the wrong next stop, redundant edges, and "consider" missing 
  stops. Drafts narratives only on request, after a nudge to try 
  first. Future improvements: the last scope bullet below (components 
  that grew a lot but are in no tour that should include them), and 
  tuning the heuristics once it's been used. Original scope, Session 
  14: `audit-waypoints` (per-node accuracy) had no counterpart for tour-level 
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

12. **Waypoint and tour authoring skill, integrated with Bram** (idea, 
  Oct 20; later). A Claude Code skill that helps create waypoints and 
  tours while working in a repo through Bram. For example, after a 
  Worklist item lands, it could offer to draft a waypoint for what 
  changed, or a tour stop linking the change to its spec and ADR. The 
  human edits and saves it in the app. Open questions: the item 5 
  question, whether AI drafting undermines the understanding-building 
  (a possible answer: the skill asks questions and the human writes, 
  rather than the skill writing); whether it writes through the app's 
  API or produces a draft the human pastes in (the existing skills are 
  deliberately read-only); whether Bram's Worklist history (item drafts 
  and commits) is the right source for "what changed and why". Related: 
  item 5 (AI suggest), the `audit-tours` skill idea above, and 
  `docs/student-kit/` (once it exists). 
  **First version (Oct 21):** `/suggest-waypoint` and `/suggest-tour` 
  (`.claude/skills/`). Answers so far: they never write to the map 
  (the human enters everything in the app); they read the site's 
  /api/data; they use Bram's worklist history for the "why" when it's 
  there; they ask questions first and give fact fields (label, type, 
  path, edges, stop order) directly; descriptions and narratives are 
  drafted only on request, after a nudge to try first. Still open: 
  whether questions-first actually builds understanding (try it, and 
  with students), and adding them to the student kit.


---

## Open problems

- How to keep waypoints and tours in sync as the code evolves. Partly
  addressed by the audit and suggest skills and the backups; the fixes
  are still made by hand, on purpose.
- How the cognitive layer (this document and the app's waypoints)
  connects to the intent layer (Spec Kit) and the technical layer (code)
  in a sustainable way. Partly addressed, but it still takes a lot of
  manual work; the approach doesn't depend on Spec Kit or any one tool.
- See also the Open Question waypoints in the Cognitive Tours map.

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
