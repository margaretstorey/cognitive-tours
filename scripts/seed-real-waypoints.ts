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
      // ── User Needs ──
      {
        id: 'w01',
        label: 'Developers lose shared understanding over time',
        type: 'User Need',
        description: 'The core problem Shrimp solves: as teams build with AI, code accumulates faster than understanding. Reading code tells you what a system does, but not why it exists, how it fits together, or where the risky parts are. This is cognitive and intent debt.',
        notes: 'Described in the Triple Debt paper (cognitive debt + intent debt)',
        filePath: null,
        posX: 80, posY: 200,
      },
      {
        id: 'w02',
        label: 'New developers need guided onboarding into intent',
        type: 'User Need',
        description: 'A new developer joining a project should be able to understand not just what the code does, but why it was built that way. Without guided navigation, onboarding is slow, painful, and relies on tribal knowledge.',
        notes: null,
        filePath: null,
        posX: 80, posY: 380,
      },
      {
        id: 'w03',
        label: 'AI agents need structured context to work safely',
        type: 'User Need',
        description: 'AI coding agents optimise for the wrong objectives when intent is missing. Waypoints give agents structured, self-contained context — ADRs, constraints, instructions — so they can work safely and intentionally within a codebase.',
        notes: 'Constitution Principle VIII: Human and Agent Readable',
        filePath: null,
        posX: 80, posY: 560,
      },

      // ── Features ──
      {
        id: 'w04',
        label: 'Waypoints',
        type: 'Feature',
        description: 'A Waypoint is a meaningful place in a software project — a user need, a design decision, a risky area, a key component, a test, an open question, or a todo. Waypoints are the nodes of the understanding map.',
        notes: null,
        filePath: 'app/lib/types.ts',
        posX: 380, posY: 120,
      },
      {
        id: 'w05',
        label: 'Tours',
        type: 'Feature',
        description: 'A Tour is an ordered path through Waypoints. Instead of dropping someone into a graph and saying "good luck", a Tour guides them through a curated narrative — like a museum audio guide for your codebase or intent map.',
        notes: 'Originated in TagSEA Routes (2006) and the Tours Eclipse plugin',
        filePath: 'app/lib/types.ts',
        posX: 380, posY: 300,
      },
      {
        id: 'w06',
        label: 'Waypoints and Tours are Universal',
        type: 'Feature',
        description: 'A waypoint can represent anything meaningful: a decision, a risk, a component, a todo, or an open question. A tour can represent any ordered narrative: onboarding, a prioritized backlog, a sprint, or a roadmap. Shrimp is a unified intent and navigation layer.',
        notes: 'Constitution Principle VI',
        filePath: null,
        posX: 380, posY: 480,
      },
      {
        id: 'w07',
        label: 'File Path links',
        type: 'Feature',
        description: 'Waypoints can optionally link to a file in the project. Clicking the path copies it to the clipboard. This connects intent artifacts to the code they describe — closing the loop between why and where.',
        notes: 'Phase 3 will add file preview in the detail panel',
        filePath: 'app/components/WaypointDetail.tsx',
        posX: 380, posY: 660,
      },

      // ── ADRs ──
      {
        id: 'w08',
        label: 'ADR: Use React Flow for graph visualization',
        type: 'ADR',
        description: 'Decision: use @xyflow/react for the graph canvas. Saves weeks of custom graph work. React Flow is TypeScript-first, mature, and handles node rendering, edge routing, drag-to-connect, and pan/zoom out of the box.',
        notes: null,
        filePath: 'docs/adr/001-use-react-flow.md',
        posX: 700, posY: 120,
      },
      {
        id: 'w09',
        label: 'ADR: Local state for MVP (now superseded)',
        type: 'ADR',
        description: 'Decision: Phase 1 used React useState with mock data only — no database. Rationale: validate the core concept before adding infrastructure. Now superseded by Phase 2 SQLite + Prisma persistence.',
        notes: 'Status: Superseded by Phase 2',
        filePath: 'docs/adr/002-local-state-for-mvp.md',
        posX: 700, posY: 300,
      },
      {
        id: 'w10',
        label: 'ADR: SQLite + Prisma for persistence',
        type: 'ADR',
        description: 'Decision: use SQLite via Prisma ORM for local persistence. Rationale: single-user app with no need for a server database. SQLite runs in-process, requires no setup, and Prisma provides type-safe queries and migrations.',
        notes: 'Phase 2 implementation',
        filePath: 'prisma/schema.prisma',
        posX: 700, posY: 480,
      },
      {
        id: 'w11',
        label: 'ADR: Optimistic updates for all mutations',
        type: 'ADR',
        description: 'Decision: all mutations (create, update, delete) update local React state immediately and write to the database in the background. On failure, the state snapshot is restored and an error banner is shown. Makes the UI feel instant.',
        notes: null,
        filePath: 'app/components/ShrimpApp.tsx',
        posX: 700, posY: 660,
      },

      // ── Code Components ──
      {
        id: 'w12',
        label: 'ShrimpApp — root state component',
        type: 'Code Component',
        description: 'The single "use client" root that owns all app state (waypoints, edges, tours, selection, active tour, load state, error message). All mutation handlers are defined here and passed as props. Keeps state management simple — no global stores.',
        notes: null,
        filePath: 'app/components/ShrimpApp.tsx',
        posX: 1020, posY: 200,
      },
      {
        id: 'w13',
        label: 'WaypointGraph — React Flow canvas',
        type: 'Code Component',
        description: 'The left-panel component that renders the understanding map as an interactive graph. Uses React Flow with a custom WaypointNode type for type-coloured nodes and drag-to-connect handles. Supports pan, zoom, node drag, edge delete.',
        notes: null,
        filePath: 'app/components/WaypointGraph.tsx',
        posX: 1020, posY: 380,
      },
      {
        id: 'w14',
        label: 'WaypointDetail — right panel',
        type: 'Code Component',
        description: 'The right-panel component showing the selected waypoint\'s type badge, title, description, notes, and file path (with clipboard copy). Also surfaces Edit and Delete actions. Shows an empty-state prompt when nothing is selected.',
        notes: null,
        filePath: 'app/components/WaypointDetail.tsx',
        posX: 1020, posY: 560,
      },
      {
        id: 'w15',
        label: 'TourBar — tour navigation',
        type: 'Code Component',
        description: 'The top-bar component with tour selector dropdown, Prev/Next/Finish buttons, step counter, and tour editor popup. The editor lets users create and edit tours by adding waypoints in order with up/down reordering.',
        notes: null,
        filePath: 'app/components/TourBar.tsx',
        posX: 1020, posY: 740,
      },
      {
        id: 'w16',
        label: 'WaypointForm — create/edit form',
        type: 'Code Component',
        description: 'Modal form for creating and editing waypoints. Fields: label, type (8 options), description, notes, filePath. Opened from the graph "+ Add Waypoint" button or the detail panel Edit action.',
        notes: null,
        filePath: 'app/components/WaypointForm.tsx',
        posX: 1020, posY: 920,
      },
      {
        id: 'w17',
        label: 'Core data types',
        type: 'Code Component',
        description: 'TypeScript interfaces for the entire app: WaypointType (union of 8 types), Waypoint, WaypointEdge, Tour, AppState. The single source of truth for what every entity is. All components and API routes import from here.',
        notes: null,
        filePath: 'app/lib/types.ts',
        posX: 1300, posY: 200,
      },
      {
        id: 'w18',
        label: 'Prisma schema',
        type: 'Code Component',
        description: 'Defines the SQLite database structure: Waypoint, Edge, Tour, TourWaypoint (join table with order column for preserving tour waypoint sequence). The source of truth for persistence.',
        notes: null,
        filePath: 'prisma/schema.prisma',
        posX: 1300, posY: 380,
      },
      {
        id: 'w19',
        label: 'db-mappers — Prisma to AppState translation',
        type: 'Code Component',
        description: 'Pure functions that translate between Prisma database rows and AppState TypeScript types: toWaypoint(), toEdge(), toTour(). Converts posX/posY → position: {x,y} and handles nullable → undefined conversions.',
        notes: null,
        filePath: 'app/lib/db-mappers.ts',
        posX: 1300, posY: 560,
      },

      // ── Tests ──
      {
        id: 'w20',
        label: 'Playwright tests — not yet written',
        type: 'Test',
        description: 'Acceptance tests to be written using Playwright: (1) persistence — create waypoint, refresh, verify present; (2) tour navigation — step through all waypoints, verify highlight; (3) delete cascade — delete waypoint, verify removed from graph, edges, and tours.',
        notes: 'TODO: write before deploying to Vercel for real users',
        filePath: null,
        posX: 700, posY: 840,
      },
      {
        id: 'w21',
        label: 'Manual tour navigation acceptance test',
        type: 'Test',
        description: 'Manual acceptance test: select "How Shrimp Works" tour, advance through all steps, verify each step highlights the correct graph node and shows the correct detail content, confirm the last step shows "Finish".',
        notes: null,
        filePath: null,
        posX: 700, posY: 1020,
      },

      // ── Risks ──
      {
        id: 'w22',
        label: 'Graph becomes too dense to navigate',
        type: 'Risk',
        description: 'As a project grows, the graph may become cluttered with dozens of overlapping nodes and crossing edges. Mitigation: keep projects to 10-30 waypoints for now. Filtering, search, and grouping are future features.',
        notes: null,
        filePath: null,
        posX: 380, posY: 840,
      },
      {
        id: 'w23',
        label: 'SQLite not suitable for cloud deployment',
        type: 'Risk',
        description: 'SQLite runs locally and resets on Vercel deployments (ephemeral filesystem). For cloud deployment, migrate to Turso (SQLite-compatible, hosted) or PostgreSQL. Not a concern for local single-user use.',
        notes: 'Mitigation: use Turso when ready to deploy',
        filePath: null,
        posX: 380, posY: 1020,
      },

      // ── AI Instructions ──
      {
        id: 'w24',
        label: 'Read the spec and constitution before writing components',
        type: 'AI Instruction',
        description: 'INSTRUCTION FOR AI AGENTS: Before writing any component or API route, read specs/001-shrimp-mvp/spec.md, plan.md, and the constitution at .specify/memory/constitution.md. Do not add props, state, or features not defined in the contracts. Follow Principle I (Simplicity) and Principle VIII (Human and Agent Readable).',
        notes: null,
        filePath: '.specify/memory/constitution.md',
        posX: 1300, posY: 740,
      },
      {
        id: 'w25',
        label: 'Shrimp 2.0 Constitution',
        type: 'AI Instruction',
        description: 'The governing principles for how Shrimp is built. Eight principles: Simplicity, Incremental Growth, Intent Before Implementation, Clean TypeScript, Minimal UI, Universal Waypoints and Tours, Flexible Navigation, Human and Agent Readable.',
        notes: 'Version 1.2.0 — ratified 2026-05-21',
        filePath: '.specify/memory/constitution.md',
        posX: 1300, posY: 920,
      },

      // ── Open Questions ──
      {
        id: 'w26',
        label: 'How should waypoints be exported and shared?',
        type: 'Open Question',
        description: 'When a project\'s understanding map is ready to share, how does it leave Shrimp? Options: export to JSON, export to Markdown, publish as a read-only URL, push to GitHub wiki, or embed in a README. Not in scope for current phases.',
        notes: null,
        filePath: null,
        posX: 80, posY: 840,
      },
      {
        id: 'w27',
        label: 'Should Shrimp be a VS Code extension?',
        type: 'Open Question',
        description: 'Would Shrimp be more useful as a VS Code extension (embedded in the editor, direct file access) vs a standalone web app (tool-agnostic, shareable URL) vs a local CLI tool? Each changes the architecture significantly.',
        notes: 'Current choice: web app for maximum accessibility',
        filePath: null,
        posX: 80, posY: 1020,
      },
      {
        id: 'w28',
        label: 'How to show file contents in the detail panel?',
        type: 'Open Question',
        description: 'Phase 3 idea: add a "File" tab to the detail panel showing the contents of the linked file. Needs a server-side API route to read files safely. Should it show the full file or just relevant sections? How to handle large files?',
        notes: 'Planned for Phase 4',
        filePath: null,
        posX: 80, posY: 1200,
      },

      // ── Research / Historical ──
      {
        id: 'w29',
        label: 'Triple Debt paper — cognitive, intent, technical debt',
        type: 'User Need',
        description: 'Storey (2026): proposes a triple debt model for software health. Technical debt lives in code, cognitive debt lives in people (eroded shared understanding), intent debt lives in artifacts (missing rationale and goals). Shrimp directly addresses cognitive and intent debt.',
        notes: 'The research motivation for Shrimp 2.0',
        filePath: null,
        posX: 1300, posY: 1100,
      },
      {
        id: 'w30',
        label: 'Tours — original Eclipse IDE plugin (2006)',
        type: 'User Need',
        description: 'Cheng, Desmond, Storey (2006): Tours is an Eclipse plugin that lets programmers give live technical presentations by combining slideware with guided navigation through code waypoints. The direct ancestor of Shrimp\'s tour concept. "Like Routes, but with a tour guide equipped with a flashlight and a dimmer switch."',
        notes: 'Predecessor: TagSEA waypoints + Routes → Tours Eclipse plugin → Shrimp 2.0',
        filePath: null,
        posX: 1300, posY: 1300,
      },
    ],
  });

  console.log(`✓ Created ${waypoints.count} waypoints`);

  // ─── EDGES ───────────────────────────────────────────────────────────────────

  const edges = await prisma.edge.createMany({
    data: [
      // User needs → features
      { id: 'e01', source: 'w01', target: 'w04', label: 'solved by' },
      { id: 'e02', source: 'w01', target: 'w05', label: 'solved by' },
      { id: 'e03', source: 'w02', target: 'w05', label: 'solved by' },
      { id: 'e04', source: 'w03', target: 'w25', label: 'addressed by' },
      // Features → features
      { id: 'e05', source: 'w04', target: 'w05', label: 'used in' },
      { id: 'e06', source: 'w04', target: 'w06', label: 'extends to' },
      { id: 'e07', source: 'w04', target: 'w07', label: 'enhanced by' },
      // ADRs → components
      { id: 'e08', source: 'w08', target: 'w13', label: 'implemented in' },
      { id: 'e09', source: 'w10', target: 'w18', label: 'implemented in' },
      { id: 'e10', source: 'w11', target: 'w12', label: 'implemented in' },
      // Components → types
      { id: 'e11', source: 'w17', target: 'w12', label: 'used by' },
      { id: 'e12', source: 'w17', target: 'w13', label: 'used by' },
      { id: 'e13', source: 'w17', target: 'w14', label: 'used by' },
      { id: 'e14', source: 'w17', target: 'w15', label: 'used by' },
      { id: 'e15', source: 'w18', target: 'w19', label: 'mapped by' },
      { id: 'e16', source: 'w19', target: 'w12', label: 'used by' },
      // ShrimpApp → panels
      { id: 'e17', source: 'w12', target: 'w13', label: 'renders' },
      { id: 'e18', source: 'w12', target: 'w14', label: 'renders' },
      { id: 'e19', source: 'w12', target: 'w15', label: 'renders' },
      { id: 'e20', source: 'w12', target: 'w16', label: 'opens' },
      // Research lineage
      { id: 'e21', source: 'w30', target: 'w05', label: 'inspired' },
      { id: 'e22', source: 'w29', target: 'w01', label: 'motivates' },
      { id: 'e23', source: 'w29', target: 'w03', label: 'motivates' },
      // Risks
      { id: 'e24', source: 'w22', target: 'w06', label: 'mitigated by' },
      { id: 'e25', source: 'w23', target: 'w10', label: 'leads to' },
      // Constitution
      { id: 'e26', source: 'w25', target: 'w24', label: 'governs' },
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
      waypointIds: ['w29', 'w30', 'w01', 'w02', 'w03', 'w04', 'w05', 'w06'],
    },
    {
      id: 't03',
      name: 'Intent-First Development in Practice',
      description: 'How Shrimp was built using intent-first development — constitution, spec, plan, tasks, then code. Each waypoint in this tour is an artifact from that process.',
      waypointIds: ['w25', 'w08', 'w09', 'w10', 'w11', 'w12', 'w20'],
    },
    {
      id: 't04',
      name: 'New Developer Orientation',
      description: 'Start here if you just joined the project. Covers why Shrimp exists, what the core concepts are, and where to find the key files.',
      waypointIds: ['w01', 'w04', 'w05', 'w12', 'w17', 'w25', 'w24', 'w26'],
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