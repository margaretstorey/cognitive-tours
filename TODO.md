# Shrimp 2.0 — TODO & Roadmap

## ✅ Done (MVP)
- [x] Next.js + TypeScript + Tailwind + React Flow setup
- [x] Spec Kit constitution, spec, plan, tasks
- [x] Three-panel layout: graph (left), detail (right), tour bar (top)
- [x] 8 waypoint types with colour coding
- [x] 2 sample tours with Next/Prev navigation
- [x] Create, edit, delete waypoints
- [x] Create, edit tours with ordered waypoints
- [x] Drag to connect waypoints
- [x] GitHub repo + SSH setup
- [x] Two formal ADRs: docs/adr/001-use-react-flow.md and docs/adr/002-local-state-for-mvp.md
- [x] Waypoints w04 and w05 reference real ADR files in notes field

---

## 🔜 Phase 2 — Persistence + File Links

### Persistence (SQLite + Prisma)
- [ ] Install and configure Prisma with SQLite
- [ ] Define database schema for Waypoint, WaypointEdge, Tour
- [ ] Seed database with current mock data (so it becomes the starting point)
- [ ] Replace useState in ShrimpApp with database reads/writes via API routes
- [ ] Data should survive page refresh ✅

### File Links
- [ ] Add `filePath?: string` field to Waypoint type in types.ts
- [ ] Add filePath input to WaypointForm
- [ ] In WaypointDetail, render filePath as a clickable `vscode://` link that opens the file in VS Code
- [ ] Update ADR waypoints (w04, w05) to use the new filePath field instead of notes

---

## 🔮 Phase 3 — Richer File References + AI Assistance

- [ ] Add `fileRef?: { path: string; line?: number }` to Waypoint type
- [ ] Allow waypoints to point to a specific line number in a file
- [ ] Add a "suggest waypoints" feature — AI scans the codebase and proposes waypoints
- [ ] Add filtering/search to the graph (needed once projects have 20+ waypoints)

---

## 🚀 Phase 4 — GitHub Integration

- [ ] Replace local file paths with GitHub URLs
- [ ] Clickable links open exact lines in GitHub
- [ ] Explore CodeScene integration for code health data
- [ ] Export understanding map as JSON or Markdown
- [ ] Publish map as a read-only URL (resolves Open Question waypoint w12)

---

## 🧪 Testing (Playwright)
- [ ] Write Playwright test for core persistence flow: create waypoint → refresh → verify still present
- [ ] Write Playwright test for tour navigation: select tour → step through all waypoints → verify each highlights correctly (based on manual test in waypoint w09)
- [ ] Write Playwright test for delete cascade: delete waypoint → verify removed from graph, edges, and tours
- [ ] Do this before deploying to Vercel for real users

---

## 💡 Ideas & Open Questions
- How should waypoints be exported/shared? (JSON? Markdown? GitHub wiki?)
- Should tours be exportable as a standalone walkthrough document?
- Could Shrimp be used to document Shrimp itself as a real project? (yes — start this in Phase 2!)
- Add `rationale` field to Waypoint to make intent capture more explicit (from triple debt paper)
- Consider adding `cognitiveDebtSignals` field — a place to note confusion, open questions, risky areas
- ADR 002 status is "Superseded" — update it when Phase 2 persistence is complete

---

## 📚 Resources
- Triple debt paper: cognitive debt, intent debt, technical debt framework
- Spec Kit: github.com/github/spec-kit
- React Flow docs: reactflow.dev
- Prisma docs: prisma.io
- ADRs: docs/adr/