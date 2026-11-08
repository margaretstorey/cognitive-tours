# Cognitive Tours

<!-- Semi-automated by Claude-->

A software comprehension tool where developers create waypoints and guided 
tours to navigate intent, decisions, and code together.

**Status:** a research prototype, built by its author with AI assistance 
(Claude Code), and used on itself: the map and tours describe how it was 
built. Feedback and ideas are welcome.

The core thesis: understanding cannot be outsourced or automated. Tours you 
create yourself repair your own cognitive debt, tours you create for others are sharing some
of your understanding with others. AI is a scaffold, an amplifier, not a 
substitute.

**If you are a new collaborator, start here:** Open the live app and follow 
the tours before reading any code. "Cognitive Tours - A Research Story" explains 
the research motivation. "How Cognitive Tours Work" walks through the code 
architecture. The app is self-documenting — the tours are the onboarding.

**Try it:** see **[Getting started](docs/GETTING-STARTED.md)**: the public demo
(https://cognitive-tours-demo.vercel.app, a copy of the self-documenting
Cognitive Tours map, reset nightly), a Flask example, blank sandboxes to try
writing your own tours, and how to use the AI skills in your own repo.  
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

Tours support **docent mode** — per-step narrative written by the tour author 
that guides the reader between waypoints, like a museum audio guide. Tours can 
also be toggled to a **markdown view** and exported as dated snapshots to the 
`tours/` folder. The graph panel has a **search/filter bar** to find nodes 
quickly as the map grows.

---

## Ontology (in progress!)

Waypoints are typed - and for now hardcoded.  Edges are not typed.
Waypoints can be of type: Goal, User need, feature, ADR, risk, open question, code components
Tours link waypoints according to a goal (name of the tour)

---

## Skills for Claude Code

A Claude Code plugin, **cognitive-tours**, bundles five skills that work in
any repo. Install it once, **in your terminal**:

```
claude plugin install cognitive-tours --marketplace margaretstorey/cognitive-tours
```

or **inside Claude Code** (at Claude's prompt, not the shell's):

```
/plugin install cognitive-tours --marketplace margaretstorey/cognitive-tours
```

(Older Claude Code: `/plugin marketplace add margaretstorey/cognitive-tours`,
then `/plugin install cognitive-tours@cognitive-tours`.) Restart any open
Claude Code session to pick up the skills. To get a newer version later:
`claude plugin update cognitive-tours`.

You don't have to remember the commands: ask Claude Code in your own words,
such as "make a starting map of this repo", "help me record what I just
did", "add this to a tour" or "which of my tours are stale?", and it picks
the right skill.

- **`/cognitive-tours:first-tours site <url>`**: no blank page on a repo you
  don't know yet. It reads the repo and, after you OK the plan, adds a
  starting map: about a dozen waypoints and two short tours (the user's view
  and the builder's view), marked as drafted by Claude for you to check and
  rewrite. An empty map's **Copy command** button gives you this command
  with the site filled in.
- **`suggest-waypoint`, `suggest-tour`**: ask you questions so you record
  recent work as waypoints and tours in your own words.
- **`audit-waypoints`, `audit-tours`**: report where the map has drifted from
  the code.

Try it on a blank sandbox: https://cognitive-tours-sandbox1.vercel.app.
Details in [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md#3-the-ai-skills-claude-code).
The plugin's files are in [`plugins/cognitive-tours/`](plugins/cognitive-tours/).

---

## Running your own instance
See [SETUP.md](./SETUP.md) for instructions on cloning this to run against your own database and project.

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

### Environment variables

To connect to the shared Turso database, 
create a `.env.local` file:

TURSO_DATABASE_URL=your-turso-url

TURSO_AUTH_TOKEN=your-turso-token

Contact Margaret-Anne for the credentials.

**Note:** The shared database has no conflict protection. If two people 
edit simultaneously, changes can overwrite each other silently. Coordinate 
with Margaret-Anne before making significant changes, and back up `/api/data` 
first. Alternatively, create your own Turso database at turso.tech for 
isolated local development.

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

## License

MIT. See [LICENSE](LICENSE).
