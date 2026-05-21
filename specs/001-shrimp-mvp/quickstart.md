# Quickstart: Shrimp 2.0 MVP

**Date**: 2026-05-21 | **Branch**: `001-shrimp-mvp`

## Prerequisites

- Node.js 20+
- All dependencies already installed (`npm install` was run)

## Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a desktop browser (1280px wide minimum).

## What you should see

On load, the app displays:
- **Top bar**: Tour selector showing "New Developer Orientation" and "Why Waypoints and Tours Exist"
- **Left panel**: A graph of ~12 waypoints representing Shrimp's own design, connected by edges
- **Right panel**: Empty state ("Select a waypoint to see details")

## Basic interactions

**Explore the map**
1. Click any node in the graph — the right panel shows its type, title, and description
2. Notice each node color corresponds to its type (User Need = blue, Risk = red, etc.)

**Follow a tour**
1. Select "New Developer Orientation" from the tour dropdown
2. Use Next / Prev buttons to step through the waypoints
3. The graph highlights the current waypoint; the detail panel shows its content
4. Reach the last step — the Next button reads "Finish"

**Create a waypoint**
1. Click the "Add Waypoint" button (on the graph canvas or toolbar)
2. Fill in a title and choose a type — description is optional
3. Click Save — the new node appears in the graph

**Connect two waypoints**
1. Hover a node — connection handles appear on its edges
2. Drag from a handle to another node — an edge appears

**Edit or delete a waypoint**
1. Click a node to select it
2. In the right panel, click Edit to modify it or Delete to remove it
3. Deletion removes all its edges and removes it from any tours

## Build for production

```bash
npm run build
npm run start
```

## Lint

```bash
npm run lint
```

## Known limitations (MVP)

- State is ephemeral — all data resets on page refresh
- No mobile or tablet layout
- No persistence, authentication, or external integrations
- Tours created manually cannot reference waypoints added after the tour was created
  without editing the tour
