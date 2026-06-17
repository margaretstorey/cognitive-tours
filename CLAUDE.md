@AGENTS.md
Last updated: Jun 10 2026

<!-- SPECKIT START -->
No active feature. Run `/speckit-specify` to start a new one.
<!-- SPECKIT END -->

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
**Research foundation:** Triple Debt Model paper (arXiv:2603.22106)

---

## Current technical state (June 2026)

### What is built and working
- Next.js 16 + TypeScript + Tailwind + React Flow (@xyflow/react 12)
- SQLite + Prisma persistence — data survives page refresh
- Three-panel layout: graph (left), waypoint detail (right), tour bar (top)
- 8 waypoint types with colour coding
- Tours with Next/Prev navigation and tour focus mode (non-tour nodes dim — approach under reconsideration, see Key Decisions)
- Edge labels showing relationships between waypoints
- filePath field on waypoints with clipboard copy and VS Code link
- Create, edit, delete waypoints and tours
- Drag to connect waypoints with optional edge label prompt
- 30 seeded waypoints and 5 tours (self-documenting — the app documents itself)
- Spec Kit installed with constitution at .specify/memory/constitution.md
- Filter/hide waypoints by type - toggle panel with active badge ✅
- Deployed to Vercel with Turso persistent SQLite (survives deploys, shared across users) ✅
- Root component renamed CognitiveToursApp, repo renamed to cognitive-tours ✅

### What is NOT yet built
- File content preview in detail panel
- AI-guided waypoint creation
- Export to JSON or Markdown
- Playwright automated tests
- Edge deletion via UI (keyboard delete unreliable on Mac)
- Edge detail/edit panel
- Separate Tours tab with independent layout

## Maintenance reminders
- **Backup Turso data periodically** — visit https://cognitive-tours.vercel.app/api/data and save the JSON. Last backup: June 2, 2026.
- **Update "Last updated" date** at the top of this file each session.
- **Create a waypoint** for any significant new feature or decision before closing a session.

### Known issues
- Edge deletion via keyboard doesn't work reliably on Mac
- Edge label dimming bug — labels dim incorrectly when only one endpoint is outside the active tour. Fix: only dim an edge (and its label) if BOTH source AND target are outside the active tour. See WaypointGraph.tsx dimming logic.
- Some tour connections point at wrong nodes (e.g. FileType → CognitiveTourApp should point to the Waypoints feature node instead)

---

## The ontology (waypoint types and their meaning)

Margaret-Anne's intended ontology — not fully implemented yet:

**Strategic level:**
- **Goal** — the highest level "why" (e.g. "Mitigate and repair cognitive debt") — NOT YET A TYPE
- **User Need** — specific needs that support goals

**Tactical level:**
- **Feature** — capabilities of the tool, can decompose into sub-features
- **Code Component** — implementation artifacts, intended to be hierarchical (high → low level) but currently flat
- **ADR** — architectural decision records, linked to code components
- **Test** — linked to features they validate
- **Risk** — linked to features or ADRs
- **Open Question** — unresolved issues
- **Todo** — work to be done (not yet implemented as a type)

**Intended edge semantics:**
- Goal → motivates → User Need
- User Need → supported by → Feature
- Feature → contains → Feature
- Feature → implemented by → Code Component
- Code Component → decomposes into → Code Component
- ADR → leads to → Code Component
- Test → validates → Feature
- Risk → threatens → Feature or ADR

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
- **Tours will move to their own tab** — the main graph is a map for exploration; tours are guided paths. These are different purposes and warrant separate views. Dimming non-tour nodes on the main graph is no longer the desired approach. Tours tab should use Dagre auto-layout (left-to-right or top-to-bottom) rather than manual positioning.

---

## Constitution (8 principles — v1.2.0)

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

---

## What to work on next (in priority order)

1. **Fix edge label dimming bug** — WaypointGraph.tsx, both endpoints must be outside tour to dim
2. **Repair the waypoints** — delete rogue waypoint, rename Shrimp → Cognitive Tours
   in all waypoint labels and descriptions, add a Goal-level node, fix incorrect tour connections
3. **Refine New Developer Orientation tour** — reorder for genuine newcomer narrative
4. **Begin Tours tab design** — separate tab with Dagre auto-layout, independent of main graph
5. **Write README** — explains what Cognitive Tours is, links to paper (app is now public)
6. **Edge management panel** — show edge details in right panel, delete button there
7. **Playwright tests** — before sharing with real users

---

## What Margaret-Anne is confused about

- How to keep waypoints and tours in sync as the code evolves
- Whether the current ontology (8 types) is the right one or needs a Goal level
- How the cognitive layer (this document + the app's waypoints) connects to
  the intent layer (Spec Kit) and technical layer (code) in a sustainable way

---

## Stack reference

```
app/
  components/
    CognitiveToursApp.tsx — root state, all mutation handlers
    WaypointGraph.tsx  — React Flow canvas (left panel)
    WaypointDetail.tsx — selected waypoint detail (right panel)
    TourBar.tsx        — tour navigation + editor (top bar)
    WaypointForm.tsx   — create/edit modal
  lib/
    types.ts           — TypeScript interfaces (source of truth)
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
.specify/
  memory/constitution.md — 8 principles
specs/                 — Spec Kit feature specs
docs/adr/              — Architectural Decision Records
```
<!-- COGNITIVE LAYER END -->