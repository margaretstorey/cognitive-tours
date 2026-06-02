@AGENTS.md

<!-- SPECKIT START -->
Active feature: **005-waypoint-type-filter** — see `specs/005-waypoint-type-filter/plan.md`
<!-- SPECKIT END -->

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
**GitHub:** margaretstorey/shrimp-2 (repo name predates the rename)
**Research foundation:** Triple Debt Model paper (arXiv:2603.22106)

---

## Current technical state (June 2026)

### What is built and working
- Next.js 16 + TypeScript + Tailwind + React Flow (@xyflow/react 12)
- SQLite + Prisma persistence — data survives page refresh
- Three-panel layout: graph (left), waypoint detail (right), tour bar (top)
- 8 waypoint types with colour coding
- Tours with Next/Prev navigation and tour focus mode (non-tour nodes dim)
- Edge labels showing relationships between waypoints
- filePath field on waypoints with clipboard copy and VS Code link
- Create, edit, delete waypoints and tours
- Drag to connect waypoints with optional edge label prompt
- 30 seeded waypoints and 5 tours (self-documenting — the app documents itself)
- Spec Kit installed with constitution at .specify/memory/constitution.md
- Filter/hide waypoints by type - toggle panel with active badge ✅

### What is NOT yet built
- File content preview in detail panel
- AI-guided waypoint creation
- Export to JSON or Markdown
- Deployment to Vercel (blocked by SQLite ephemeral filesystem issue)
- Playwright automated tests
- Edge deletion via UI (keyboard delete unreliable on Mac)
- Edge detail/edit panel

### Known issues
- Edge deletion via keyboard doesn't work reliably on Mac
- One rogue waypoint (w-1779834401416 "tiago forte second brain") needs deletion
- All waypoints still say "Shrimp" — needs rename to "Cognitive Tours"

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
- **SQLite locally** — Turso for cloud deployment when ready.

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
- **Rahul Garg / Lattice** — complementary tool (Martin Fowler contributor,
  engaged on LinkedIn)

---

## What to work on next (in priority order)

1. **Repair the waypoints** — delete rogue waypoint, rename Shrimp → Cognitive Tours
   in all waypoint labels and descriptions, add a Goal-level node
2. **Filter by waypoint type** — small feature, high impact for usability
3. **Refine New Developer Orientation tour** — reorder for genuine newcomer narrative
4. **Edge management panel** — show edge details in right panel, delete button there
5. **Deploy to Vercel** — using Turso for persistent SQLite in cloud
6. **Write README** — explains what Cognitive Tours is, links to paper
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
    ShrimpApp.tsx      — root state, all mutation handlers
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
