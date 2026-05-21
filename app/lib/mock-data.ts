import type { Waypoint, WaypointEdge, Tour } from './types';

export const INITIAL_WAYPOINTS: Waypoint[] = [
  {
    id: 'w01',
    label: 'Developers need mental models, not code',
    type: 'User Need',
    description: 'The core problem Shrimp solves: reading code tells you what a system does, but not why it exists, how it fits together, or where the risky parts are. Shrimp makes intent and rationale navigable.',
    position: { x: 100, y: 200 },
  },
  {
    id: 'w02',
    label: 'Waypoints',
    type: 'Feature',
    description: 'A Waypoint is a meaningful place in a software project — a user need, a design decision, a risky area, a key component, a test, or an open question. Waypoints are the nodes of the understanding map.',
    position: { x: 380, y: 80 },
  },
  {
    id: 'w03',
    label: 'Tours',
    type: 'Feature',
    description: 'A Tour is an ordered path through Waypoints. Instead of dumping someone into a graph and saying "good luck", a Tour guides them through a curated narrative — like a museum audio guide for your codebase.',
    position: { x: 380, y: 320 },
  },
  {
    id: 'w04',
    label: 'Local state only for MVP',
    type: 'ADR',
    description: 'Decision: all data lives in React useState and resets on page refresh. Rationale: shipping a working, demonstrable tool matters more than persistence. A database adds complexity we don\'t need to validate the core concept.',
    notes: 'Full decision record: docs/adr/002-local-state-for-mvp.md',
    position: { x: 660, y: 320 },
  },
  {
    id: 'w05',
    label: 'React Flow for graph visualization',
    type: 'ADR',
    description: 'Decision: use @xyflow/react for the graph canvas. Rationale: React Flow is a mature, TypeScript-first library that handles node rendering, edge routing, drag-to-connect, and pan/zoom — saving weeks of custom graph work.',
    notes: 'Full decision record: docs/adr/001-use-react-flow.md',
    position: { x: 660, y: 80 },
  },
  {
    id: 'w06',
    label: 'ShrimpApp — root state component',
    type: 'Code Component',
    description: 'The single "use client" root that owns all AppState (waypoints, edges, tours, selection, active tour). All mutation handlers are defined here and passed as props. This keeps state management simple and avoids global stores.',
    position: { x: 940, y: 200 },
  },
  {
    id: 'w07',
    label: 'WaypointGraph — React Flow canvas',
    type: 'Code Component',
    description: 'The left-panel component that renders the understanding map as an interactive graph. Uses React Flow with a custom WaypointNode type for type-colored nodes and drag-to-connect handles.',
    position: { x: 1220, y: 80 },
  },
  {
    id: 'w08',
    label: 'WaypointDetail — right panel',
    type: 'Code Component',
    description: 'The right-panel component that shows the selected waypoint\'s type badge, title, description, and notes. Also surfaces Edit and Delete actions. Shows an empty-state prompt when nothing is selected.',
    position: { x: 1220, y: 320 },
  },
  {
    id: 'w09',
    label: 'Tour navigation acceptance test',
    type: 'Test',
    description: 'Manual acceptance test: select "New Developer Orientation", advance through all 6 steps, verify each step highlights the correct graph node and shows the correct detail content, confirm the last step shows "Finish".',
    position: { x: 660, y: 500 },
  },
  {
    id: 'w10',
    label: 'Graph becomes too dense to navigate',
    type: 'Risk',
    description: 'As a project grows, the graph may become cluttered with dozens of overlapping nodes and crossing edges. Mitigation: keep MVP scope small (a project should have 10–30 waypoints). Filtering and search are future features.',
    position: { x: 380, y: 500 },
  },
  {
    id: 'w11',
    label: 'Read the spec before writing components',
    type: 'AI Instruction',
    description: 'INSTRUCTION FOR AI AGENTS: Before writing any component, read specs/001-shrimp-mvp/spec.md, plan.md, and contracts/ui-contracts.md. Do not add props, state, or features not defined in the contracts. Follow Constitution Principle I (Simplicity).',
    position: { x: 940, y: 500 },
  },
  {
    id: 'w13',
    label: 'Waypoints and Tours are Universal',
    type: 'Feature',
    description: 'A waypoint can represent anything meaningful: a decision, a risk, a component, a todo, or an open question. A tour can represent any ordered narrative: onboarding, a prioritized backlog, a sprint, or a roadmap. Shrimp is a unified intent and navigation layer, not just a code understanding tool.',
    position: { x: 100, y: 450 },
  },
  {
    id: 'w12',
    label: 'How should waypoints be exported/shared?',
    type: 'Open Question',
    description: 'Unresolved: when a project\'s understanding map is ready to share, how does it leave Shrimp? Options include: export to JSON, export to Markdown, publish as a read-only URL, or push to a GitHub wiki. Not in scope for MVP.',
    position: { x: 1220, y: 500 },
  },
];

export const INITIAL_EDGES: WaypointEdge[] = [
  { id: 'e01', source: 'w01', target: 'w02' },
  { id: 'e02', source: 'w01', target: 'w03' },
  { id: 'e03', source: 'w02', target: 'w03' },
  { id: 'e04', source: 'w05', target: 'w07' },
  { id: 'e05', source: 'w06', target: 'w07' },
  { id: 'e06', source: 'w06', target: 'w08' },
  { id: 'e07', source: 'w03', target: 'w09' },
  { id: 'e08', source: 'w10', target: 'w04' },
  { id: 'e09', source: 'w01', target: 'w13' },
  { id: 'e10', source: 'w02', target: 'w13' },
  { id: 'e11', source: 'w03', target: 'w13' },
];

export const INITIAL_TOURS: Tour[] = [
  {
    id: 't01',
    name: 'New Developer Orientation',
    description: 'A first tour for someone who just joined the project. Starts with why Shrimp exists and walks through the core concepts and key components.',
    waypointIds: ['w01', 'w02', 'w03', 'w06', 'w04', 'w12'],
  },
  {
    id: 't02',
    name: 'Why Waypoints and Tours Exist',
    description: 'A philosophical tour explaining the design rationale behind Shrimp — from the core problem through the risks, the technology choices, and the guiding concepts.',
    waypointIds: ['w01', 'w10', 'w05', 'w02', 'w03', 'w11'],
  },
];
