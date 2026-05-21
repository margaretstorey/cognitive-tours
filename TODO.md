# Shrimp 2.0 Roadmap

## Phase 1 — MVP (complete ✅)

- [x] Three-panel layout: tour selector, graph canvas, waypoint detail
- [x] 8 waypoint types with distinct colors
- [x] React Flow graph with drag-to-connect edges
- [x] Create, edit, delete waypoints (cascade delete)
- [x] Guided tours with Next/Prev navigation
- [x] Create and edit tours with ordered waypoint lists
- [x] Mock data: Shrimp explains itself (12 waypoints, 2 sample tours)
- [x] ADRs for React Flow and local-state decisions

---

## Phase 2 — Persistence

- [ ] Replace local state with SQLite + Prisma (see ADR 002)
- [ ] Projects: a project is a named collection of waypoints, edges, and tours
- [ ] Create, switch, and delete projects
- [ ] Data survives page refresh

---

## Phase 3 — Sharing & Export

- [ ] Export a project as JSON (import/export roundtrip)
- [ ] Export a tour as Markdown (one section per waypoint)
- [ ] Read-only share link for a project (resolve Open Question w12)

---

## Phase 4 — GitHub Integration

- [ ] Link a waypoint to a file path or GitHub URL
- [ ] Import waypoints from a repository's README or docs folder
- [ ] Sync ADR files from `docs/adr/` into ADR-type waypoints automatically

---

## Phase 5 — AI Assistance

- [ ] AI-suggested waypoints based on repo structure
- [ ] AI-generated tour narratives from waypoint descriptions
- [ ] AI summarization of linked files into waypoint descriptions

---

## Known limitations (accepted for MVP)

- Data resets on page refresh — no persistence until Phase 2
- Desktop only — no mobile layout
- No authentication or multi-user support
- No search or filter within the graph
