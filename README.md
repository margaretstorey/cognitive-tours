# Cognitive Tours

<!-- Semi-automated by Claude-->

A software comprehension tool where developers create waypoints and guided 
tours to navigate intent, decisions, and code together.

The core thesis: understanding cannot be outsourced or automated. Tours you 
create yourself repair your own cognitive debt, tours you create for others are sharing some
of your understanding with others. AI is a scaffold, an amplifier, not a 
substitute.

**Live app:** https://cognitive-tours.vercel.app  
<!-- Note this is not password protected -->
**Domains:** cognitive.tours | cognitivetours.dev  
**Research foundation:** [From Technical Debt to Cognitive and Intent Debt](https://arxiv.org/abs/2603.22106) (Storey, 2026)

---

## What it does

Cognitive Tours lets you place waypoints on an interactive graph — each 
waypoint is a meaningful place in your project: a user need, a design 
decision, a risk, a key component, a test, or an open question. You then 
connect waypoints into guided tours that tell the story of your codebase.

The app is self-documenting: the waypoints and tours in the live app 
describe Cognitive Tours itself.

---

## Ontology (in progress!)

Waypoints are typed - and for now hardcoded.  Edges are not typed.
Waypoints can be of type: Goal, User need, feature, ADR, risk, open question, code components
Tours link waypoints according to a goal (name of the tour)

---

## Running locally

```bash
git clone https://github.com/margaretstorey/cognitive-tours
cd cognitive-tours
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Open http://localhost:3000.

The app uses SQLite locally via Prisma. The production deployment uses 
Turso (hosted SQLite) on Vercel.

---

## Architecture

- **Next.js 16 + TypeScript + Tailwind + React Flow**
- **Three-panel layout:** graph (left), waypoint detail (right), tour bar (top)
- **Persistence:** SQLite + Prisma locally, Turso in production
- **State:** single root component `CognitiveToursApp.tsx` owns all app state

See `CLAUDE.md` for the full project state, key decisions, and backlog.

---

## Contributing

Read `CLAUDE.md` before touching any code. It is the cognitive layer — the 
bridge between intent, understanding, and code.

This project uses a two-Claude workflow: one Claude instance handles 
planning and architecture (working from CLAUDE.md), another handles 
implementation via Claude Code. If you are contributing as a developer, 
start Claude Code from the repo root and it will read CLAUDE.md 
automatically.

**Note for collaborators:** Before making significant changes, visit 
/api/data and save the JSON as a backup. There is no undo.

The constitution (8 principles) lives at `.specify/memory/constitution.md`. 
Read it before adding any feature.