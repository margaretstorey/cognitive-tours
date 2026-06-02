/**
 * Seed script: replace mock waypoints with real Shrimp 2.0 waypoints and tours.
 * Run with: npx tsx scripts/seed-real-waypoints.ts
 *
 * WARNING: This deletes all existing waypoints, edges, and tours before seeding.
 * Only run this once on a fresh database or when you want to reset to the real waypoints.
 */

import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as path from 'path';

const dbPath = path.resolve(__dirname, '../prisma/dev.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🦐 Seeding real Shrimp 2.0 waypoints and tours...');

  // Clear existing data
  await prisma.tourWaypoint.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.edge.deleteMany();
  await prisma.waypoint.deleteMany();
  console.log('✓ Cleared existing data');

  // ─── WAYPOINTS ───────────────────────────────────────────────────────────────

  const waypoints = await prisma.waypoint.createMany({
    data: [
      {
        id: 'w01',
        label: 'Code accumulates faster than understanding',
        type: 'User Need',
        description: 'A waypoint is a meaningful place in a project — a user need, a design decision, a risk, a code component, a test, an open question, or a todo. Waypoints make implicit knowledge explicit and navigable, for both humans and AI agents.',
        notes: 'Described in the Triple Debt paper (cognitive debt + intent debt)',
        filePath: null,
        posX: -106.66630931835579, posY: -57.26141626572192,
      },
      {
        id: 'w02',
        label: 'New developers need guided onboarding into intent',
        type: 'User Need',
        description: 'A new developer joining a project built with AI assistance may find the code works but can\'t understand why decisions were made. Onboarding relies on whoever wrote the code being available to explain it — and even they may have forgotten. Cognitive Tours addresses this by letting the team leave navigable trails of understanding behind as they build.',
        notes: null,
        filePath: null,
        posX: -99.12729700687649, posY: 255.1858954341622,
      },
      {
        id: 'w04',
        label: 'Waypoints',
        type: 'Feature',
        description: 'A Waypoint is a meaningful place in a software project — a user need, a design decision, a risky area, a key component, a test, an open question, or a todo. Waypoints are the nodes of the understanding map.',
        notes: null,
        filePath: 'app/lib/types.ts',
        posX: 357.41177617726106, posY: 13.631255748079042,
      },
      {
        id: 'w06',
        label: 'Tours',
        type: 'Feature',
        description: 'A tour can represent any ordered narrative: onboarding, a prioritized backlog, a sprint, or a roadmap. It supports navigation across waypoints to tell the story.',
        notes: 'Originated in TagSEA Routes (2006) and the Tours Eclipse plugin',
        filePath: 'app/lib/types.ts',
        posX: 205.06147688848702, posY: 109.44179741051597,
      },
      {
        id: 'w07',
        label: 'File Path links',
        type: 'Feature',
        description: 'Waypoints can optionally link to a file in the project. Clicking the path copies it to the clipboard. This connects intent artifacts to the code they describe — closing the loop between why and where.',
        notes: 'Phase 3 will add file preview in the detail panel',
        filePath: 'app/components/WaypointDetail.tsx',
        posX: 523.796405120818, posY: -20.0694608659785,
      },
      {
        id: 'w08',
        label: 'Use React Flow for graph visualization',
        type: 'ADR',
        description: 'Decision: use @xyflow/react for the graph canvas. Saves weeks of custom graph work. React Flow is TypeScript-first, mature, and handles node rendering, edge routing, drag-to-connect, and pan/zoom out of the box.',
        notes: 'One limitation: edge deletion via keyboard is unreliable on Mac — requires a workaround.',
        filePath: 'docs/adr/001-use-react-flow.md',
        posX: 1007.9895959301839, posY: -217.42665145733622,
      },
      {
        id: 'w09',
        label: 'Local state for MVP (now superseded)',
        type: 'ADR',
        description: 'Decision: Phase 1 used React useState with mock data only — no database. Rationale: validate the core concept before adding infrastructure. Now superseded by Phase 2 SQLite + Prisma persistence.',
        notes: 'Status: Superseded by Phase 2',
        filePath: 'docs/adr/002-local-state-for-mvp.md',
        posX: -398.1605392693176, posY: 407.7257868593978,
      },
      {
        id: 'w10',
        label: 'SQLite + Prisma for persistence',
        type: 'ADR',
        description: 'Decision: use SQLite via Prisma ORM for local persistence. Rationale: single-user app with no need for a server database. SQLite runs in-process, requires no setup, and Prisma provides type-safe queries and migrations.',
        notes: 'Phase 2 implementation',
        filePath: 'prisma/schema.prisma',
        posX: 360.0179873424771, posY: -463.9060450640875,
      },
      {
        id: 'w11',
        label: 'Optimistic updates for all mutations',
        type: 'ADR',
        description: 'Decision: all mutations update the UI immediately without waiting for database confirmation. On failure, the UI reverts and shows an error banner. Rationale: makes the graph feel responsive and natural for interactive use.',
        notes: 'More details on The decision: Optimistic updates for all mutations\nWhen you do something in the app — create a waypoint, delete an edge, update a tour — there are two possible approaches:\nPessimistic (wait for confirmation):\n\nUser clicks "Delete waypoint"\nApp sends request to database\nApp WAITS for database to confirm deletion\nOnly then does the node disappear from the graph\nFeels slow — there\'s a visible delay\n\nOptimistic (assume success):\n\nUser clicks "Delete waypoint"\nNode IMMEDIATELY disappears from the graph\nApp sends request to database in the background\nIf database confirms — nothing changes, already done\nIf database FAILS — node reappears and error banner shows\nFeels instant\n\nWhy this matters for Cognitive Tours:\nThe graph is interactive — you\'re dragging nodes, connecting edges, clicking around. Any visible delay would feel jarring. Optimistic updates make the app feel responsive and natural.\n\nPoints to the source code that implements this decision but this records it.\n\nThe risk:\nVery occasionally a write fails silently — you think you deleted something but it\'s still in the database. The error banner handles this.',
        filePath: 'app/components/ShrimpApp.tsx',
        posX: 389.0909986478742, posY: -214.95190819121254,
      },
      {
        id: 'w12',
        label: 'ShrimpApp — root state component',
        type: 'Code Component',
        description: 'The single "use client" root that owns all app state (waypoints, edges, tours, selection, active tour, load state, error message). All mutation handlers are defined here and passed as props. Keeps state management simple — no global stores.',
        notes: null,
        filePath: 'app/components/ShrimpApp.tsx',
        posX: 664.8979133450065, posY: -313.7030582021012,
      },
      {
        id: 'w13',
        label: 'WaypointGraph — React Flow canvas',
        type: 'Code Component',
        description: 'The left-panel component that renders the understanding map as an interactive graph. Uses React Flow with a custom WaypointNode type for type-coloured nodes and drag-to-connect handles. Supports pan, zoom, node drag, edge delete.',
        notes: null,
        filePath: 'app/components/WaypointGraph.tsx',
        posX: 1271.2327060424557, posY: -267.58687702369525,
      },
      {
        id: 'w14',
        label: 'WaypointDetail — right panel',
        type: 'Code Component',
        description: 'The right-panel component showing the selected waypoint\'s type badge, title, description, notes, and file path (with clipboard copy). Also surfaces Edit and Delete actions. Shows an empty-state prompt when nothing is selected.',
        notes: null,
        filePath: 'app/components/WaypointDetail.tsx',
        posX: 1002.6444187999402, posY: -105.1126595045961,
      },
      {
        id: 'w15',
        label: 'TourBar — tour navigation',
        type: 'Code Component',
        description: 'The top-bar component with tour selector dropdown, Prev/Next/Finish buttons, step counter, and tour editor popup. The editor lets users create and edit tours by adding waypoints in order with up/down reordering.',
        notes: null,
        filePath: 'app/components/TourBar.tsx',
        posX: 1140.1529254419945, posY: -369.73988326092484,
      },
      {
        id: 'w16',
        label: 'WaypointForm — create/edit form',
        type: 'Code Component',
        description: 'Modal form for creating and editing waypoints. Fields: label, type (8 options), description, notes, filePath. Opened from the graph "+ Add Waypoint" button or the detail panel Edit action.',
        notes: null,
        filePath: 'app/components/WaypointForm.tsx',
        posX: 1008.7893373117981, posY: 12.812274626061779,
      },
      {
        id: 'w17',
        label: 'Core data types',
        type: 'Code Component',
        description: 'TypeScript interfaces for the entire app: WaypointType (union of 8 types), Waypoint, WaypointEdge, Tour, AppState. The single source of truth for what every entity is. All components and API routes import from here.',
        notes: null,
        filePath: 'app/lib/types.ts',
        posX: 420.42561471855277, posY: -313.2642690942656,
      },
      {
        id: 'w18',
        label: 'Prisma schema',
        type: 'Code Component',
        description: 'Defines the SQLite database structure: Waypoint, Edge, Tour, TourWaypoint (join table with order column for preserving tour waypoint sequence). The source of truth for persistence.',
        notes: null,
        filePath: 'prisma/schema.prisma',
        posX: 691.0615669798196, posY: -456.01546060583195,
      },
      {
        id: 'w19',
        label: 'db-mappers — Prisma to AppState translation',
        type: 'Code Component',
        description: 'The database stores waypoint positions as posX and posY columns. The app expects position as {x, y}. db-mappers translates between the two.',
        notes: null,
        filePath: 'app/lib/db-mappers.ts',
        posX: 964.7313456689742, posY: -469.7443635591324,
      },
      {
        id: 'w20',
        label: 'Playwright tests — not yet written',
        type: 'Test',
        description: 'Acceptance tests to be written using Playwright: (1) persistence — create waypoint, refresh, verify present; (2) tour navigation — step through all waypoints, verify highlight; (3) delete cascade — delete waypoint, verify removed from graph, edges, and tours.',
        notes: 'TODO: write before deploying to Vercel for real users',
        filePath: null,
        posX: 252.12820826406676, posY: 707.0110282151942,
      },
      {
        id: 'w21',
        label: 'Manual tour navigation acceptance test',
        type: 'Test',
        description: 'Manual acceptance test: select "How Shrimp Works" tour, advance through all steps, verify each step highlights the correct graph node and shows the correct detail content, confirm the last step shows "Finish".',
        notes: null,
        filePath: null,
        posX: 499.99706835318045, posY: 708.4151108791078,
      },
      {
        id: 'w22',
        label: 'Graph becomes too dense to navigate',
        type: 'Risk',
        description: 'As a project grows, the graph may become cluttered with dozens of overlapping nodes and crossing edges. Mitigation: keep projects to 10-30 waypoints for now. Filtering, search, and grouping are future features.',
        notes: null,
        filePath: null,
        posX: 148.90714091479438, posY: -120.60002145248811,
      },
      {
        id: 'w23',
        label: 'SQLite not suitable for cloud deployment',
        type: 'Risk',
        description: 'SQLite runs locally and resets on Vercel deployments (ephemeral filesystem). For cloud deployment, migrate to Turso (SQLite-compatible, hosted) or PostgreSQL. Not a concern for local single-user use.',
        notes: 'Mitigation: use Turso when ready to deploy',
        filePath: null,
        posX: 49.7181558446847, posY: -460.3359826080226,
      },
      {
        id: 'w24',
        label: 'Read the spec and constitution before writing components',
        type: 'AI Instruction',
        description: 'INSTRUCTION FOR AI AGENTS: Before writing any component or API route, read specs/001-shrimp-mvp/spec.md, plan.md, and the constitution at .specify/memory/constitution.md. Do not add props, state, or features not defined in the contracts. Follow Principle I (Simplicity) and Principle VIII (Human and Agent Readable).',
        notes: null,
        filePath: '.specify/memory/constitution.md',
        posX: -408.3379314951803, posY: -103.53103234094439,
      },
      {
        id: 'w26',
        label: 'How should waypoints be exported and shared?',
        type: 'Open Question',
        description: 'When a project\'s understanding map is ready to share, how does it leave Shrimp? Options: export to JSON, export to Markdown, publish as a read-only URL, push to GitHub wiki, or embed in a README. Not in scope for current phases.',
        notes: null,
        filePath: null,
        posX: -7.034319440719926, posY: 702.8276857746367,
      },
      {
        id: 'w27',
        label: 'Should Cognitive Tours be a VS Code extension?',
        type: 'Open Question',
        description: 'Would Shrimp be more useful as a VS Code extension (embedded in the editor, direct file access) vs a standalone web app (tool-agnostic, shareable URL) vs a local CLI tool? Each changes the architecture significantly.',
        notes: 'Current choice: web app for maximum accessibility',
        filePath: null,
        posX: -233.83863080894554, posY: 705.71963849543,
      },
      {
        id: 'w28',
        label: 'How to show file contents in the detail panel?',
        type: 'Open Question',
        description: 'Phase 3 idea: add a "File" tab to the detail panel showing the contents of the linked file. Needs a server-side API route to read files safely. Should it show the full file or just relevant sections? How to handle large files?',
        notes: 'Planned for Phase 4',
        filePath: null,
        posX: -441.71535093850764, posY: 711.2897819356592,
      },
      {
        id: 'w29',
        label: 'Mitigate and repair cognitive debt',
        type: 'Goal',
        description: 'The overarching purpose of Cognitive Tours — helping developers and teams construct and maintain shared understanding of software systems, so that cognitive and intent debt don\'t accumulate and paralyze them.\n\nStorey (2026): proposes a triple debt model for software health. Technical debt lives in code, cognitive debt lives in people (eroded shared understanding), intent debt lives in artifacts (missing rationale and goals). Cognitive Tours addresses cognitive and in part intent debt.',
        notes: 'The research motivation for Cognitive Tours\n\nBackground: \n\nCheng, Desmond, Storey (2006): Tours is an Eclipse plugin that lets programmers give live technical presentations by combining slideware with guided navigation through code waypoints. The direct ancestor of Shrimp\'s tour concept. "Like Routes, but with a tour guide equipped with a flashlight and a dimmer switch."',
        filePath: null,
        posX: -416.83028629984653, posY: 118.95338124768134,
      },
    ],
  });

  console.log(`✓ Created ${waypoints.count} waypoints`);

  // ─── EDGES ───────────────────────────────────────────────────────────────────

  const edges = await prisma.edge.createMany({
    data: [
      { id: 'e07',                  source: 'w04', target: 'w07', label: 'enhanced by' },
      { id: 'e08',                  source: 'w08', target: 'w13', label: 'implemented in' },
      { id: 'e09',                  source: 'w10', target: 'w18', label: 'implemented in' },
      { id: 'e10',                  source: 'w11', target: 'w12', label: 'implemented in' },
      { id: 'e15',                  source: 'w18', target: 'w19', label: 'mapped by' },
      { id: 'e17',                  source: 'w12', target: 'w13', label: 'renders' },
      { id: 'e18',                  source: 'w12', target: 'w14', label: 'renders' },
      { id: 'e19',                  source: 'w12', target: 'w15', label: 'renders' },
      { id: 'e20',                  source: 'w12', target: 'w16', label: 'opens' },
      { id: 'e22',                  source: 'w29', target: 'w01', label: 'motivates' },
      { id: 'e25',                  source: 'w23', target: 'w10', label: 'leads to' },
      { id: 'e-1780362941968',      source: 'w01', target: 'w04', label: 'addressed by' },
      { id: 'e-1780363517566',      source: 'w07', target: 'w14', label: 'implemented by' },
      { id: 'e-1780363554082',      source: 'w07', target: 'w16', label: 'implemented by' },
      { id: 'e-1780363871581',      source: 'w17', target: 'w12', label: 'typed by' },
      { id: 'e-1780364000600',      source: 'w29', target: 'w02', label: 'motivates' },
      { id: 'e-1780364224479',      source: 'w01', target: 'w06', label: 'addressed by' },
      { id: 'e-1780364287430',      source: 'w06', target: 'w04', label: 'contains' },
      { id: 'e-1780364373430',      source: 'w02', target: 'w06', label: 'addressed by' },
      { id: 'e-1780369216892',      source: 'w22', target: 'w04', label: 'leads to' },
      { id: 'e-1780369856383',      source: 'w12', target: 'w19', label: 'depends on' },
    ],
  });

  console.log(`✓ Created ${edges.count} edges`);

  // ─── TOURS ───────────────────────────────────────────────────────────────────

  const toursData = [
    {
      id: 't01',
      name: 'How Shrimp Works — Architecture',
      description: 'A guided walkthrough of Shrimp\'s component architecture. Start with the data types, follow the state through ShrimpApp, and see how each panel renders.',
      waypointIds: ['w17', 'w12', 'w13', 'w14', 'w15', 'w16', 'w18', 'w19'],
    },
    {
      id: 't02',
      name: 'Why Shrimp Exists — The Research Story',
      description: 'The philosophical and research motivation for Shrimp. From the triple debt paper through the original Tours plugin to the modern AI-assisted development context.',
      waypointIds: ['w29', 'w01', 'w02', 'w04', 'w06'],
    },
    {
      id: 't03',
      name: 'Intent-First Development in Practice',
      description: 'How Shrimp was built using intent-first development — constitution, spec, plan, tasks, then code. Each waypoint in this tour is an artifact from that process.',
      waypointIds: ['w08', 'w09', 'w10', 'w11'],
    },
    {
      id: 't05',
      name: 'Risks and Open Questions',
      description: 'A tour of the known risks and unresolved questions in the project. Good for understanding where the boundaries are and what decisions still need to be made.',
      waypointIds: ['w22', 'w23', 'w26', 'w27', 'w28', 'w20'],
    },
  ];

  for (const tour of toursData) {
    await prisma.tour.create({
      data: {
        id: tour.id,
        name: tour.name,
        description: tour.description,
        waypoints: {
          create: tour.waypointIds.map((waypointId, order) => ({
            waypointId,
            order,
          })),
        },
      },
    });
  }

  console.log(`✓ Created ${toursData.length} tours`);
  console.log('');
  console.log('🦐 Shrimp 2.0 is now self-documented!');
  console.log(`   ${waypoints.count} waypoints · ${edges.count} edges · ${toursData.length} tours`);
  console.log('');
  console.log('Tours created:');
  toursData.forEach(t => console.log(`  · ${t.name} (${t.waypointIds.length} waypoints)`));
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
