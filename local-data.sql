PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    TEXT PRIMARY KEY NOT NULL,
    "checksum"              TEXT NOT NULL,
    "finished_at"           DATETIME,
    "migration_name"        TEXT NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        DATETIME,
    "started_at"            DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count"   INTEGER UNSIGNED NOT NULL DEFAULT 0
);
INSERT INTO _prisma_migrations VALUES('a00357cc-d0fe-4c80-8fdc-1607e784d457','d3b344a0a9c670d415385cccf18ebc56148ec9dc6bcb2c2846c789520f861fa1',1779423924726,'20260522042524_init',NULL,NULL,1779423924724,1);
INSERT INTO _prisma_migrations VALUES('a59a0ba2-7c70-470c-95e7-27ca430b82e3','ec5638948b33f5cf54ffb5a2703ca6f97ddba0222d1a0cb6d458f049c0cf4057',1779496277345,'20260523003117_add_waypoint_filepath',NULL,NULL,1779496277343,1);
CREATE TABLE IF NOT EXISTS "Waypoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "posX" REAL NOT NULL,
    "posY" REAL NOT NULL
, "filePath" TEXT);
INSERT INTO Waypoint VALUES('w01','Code accumulates faster than understanding','User Need','A waypoint is a meaningful place in a project — a user need, a design decision, a risk, a code component, a test, an open question, or a todo. Waypoints make implicit knowledge explicit and navigable, for both humans and AI agents."','Described in the Triple Debt paper (cognitive debt + intent debt)',-114.5868822226164382,-59.52443709551067741,NULL);
INSERT INTO Waypoint VALUES('w02','New developers need guided onboarding into intent','User Need','A new developer joining a project built with AI assistance may find the code works but can''t understand why decisions were made. Onboarding relies on whoever wrote the code being available to explain it — and even they may have forgotten. Cognitive Tours addresses this by letting the team leave navigable trails of understanding behind as they build.',NULL,-99.1272970068764892,255.1858954341622053,NULL);
INSERT INTO Waypoint VALUES('w04','Waypoints','Feature','A Waypoint is a meaningful place in a software project — a user need, a design decision, a risky area, a key component, a test, an open question, or a todo. Waypoints are the nodes of the understanding map.',NULL,357.4117761772610606,13.63125574807904173,'app/lib/types.ts');
INSERT INTO Waypoint VALUES('w06','Tours','Feature','A tour can represent any ordered narrative: onboarding, a prioritized backlog, a sprint, or a roadmap. It supports navigation across waypoints to tell the story.','Originated in TagSEA Routes (2006) and the Tours Eclipse plugin',205.0614768884870215,109.4417974105159743,'app/lib/types.ts');
INSERT INTO Waypoint VALUES('w07','File Path links','Feature','Waypoints can optionally link to a file in the project. Clicking the path copies it to the clipboard. This connects intent artifacts to the code they describe — closing the loop between why and where.','Phase 3 will add file preview in the detail panel',521.2001756991630827,159.5100791131333721,'app/components/WaypointDetail.tsx');
INSERT INTO Waypoint VALUES('w08','Use React Flow for graph visualization','ADR','Decision: use @xyflow/react for the graph canvas. Saves weeks of custom graph work. React Flow is TypeScript-first, mature, and handles node rendering, edge routing, drag-to-connect, and pan/zoom out of the box.','One limitation: edge deletion via keyboard is unreliable on Mac — requires a workaround.',673.9330874593191539,-22.76062853546547161,'docs/adr/001-use-react-flow.md');
INSERT INTO Waypoint VALUES('w09','Local state for MVP (now superseded)','ADR','Decision: Phase 1 used React useState with mock data only — no database. Rationale: validate the core concept before adding infrastructure. Now superseded by Phase 2 SQLite + Prisma persistence.','Status: Superseded by Phase 2',-398.16053926931761,407.7257868593977719,'docs/adr/002-local-state-for-mvp.md');
INSERT INTO Waypoint VALUES('w10','SQLite + Prisma for persistence','ADR','Decision: use SQLite via Prisma ORM for local persistence. Rationale: single-user app with no need for a server database. SQLite runs in-process, requires no setup, and Prisma provides type-safe queries and migrations.','Phase 2 implementation',360.017987342477113,-463.9060450640874933,'prisma/schema.prisma');
INSERT INTO Waypoint VALUES('w11','Optimistic updates for all mutations','ADR','Decision: all mutations update the UI immediately without waiting for database confirmation. On failure, the UI reverts and shows an error banner. Rationale: makes the graph feel responsive and natural for interactive use.',unistr('More details on The decision: Optimistic updates for all mutations\u000aWhen you do something in the app — create a waypoint, delete an edge, update a tour — there are two possible approaches:\u000aPessimistic (wait for confirmation):\u000a\u000aUser clicks "Delete waypoint"\u000aApp sends request to database\u000aApp WAITS for database to confirm deletion\u000aOnly then does the node disappear from the graph\u000aFeels slow — there''s a visible delay\u000a\u000aOptimistic (assume success):\u000a\u000aUser clicks "Delete waypoint"\u000aNode IMMEDIATELY disappears from the graph\u000aApp sends request to database in the background\u000aIf database confirms — nothing changes, already done\u000aIf database FAILS — node reappears and error banner shows\u000aFeels instant\u000a\u000aWhy this matters for Cognitive Tours:\u000aThe graph is interactive — you''re dragging nodes, connecting edges, clicking around. Any visible delay would feel jarring. Optimistic updates make the app feel responsive and natural.\u000a\u000aPoints to the source code that implements this decision but this records it.\u000a\u000aThe risk:\u000aVery occasionally a write fails silently — you think you deleted something but it''s still in the database. The error banner handles this.'),389.0909986478741871,-214.9519081912125387,'app/components/ShrimpApp.tsx');
INSERT INTO Waypoint VALUES('w12','ShrimpApp — root state component','Code Component','The single "use client" root that owns all app state (waypoints, edges, tours, selection, active tour, load state, error message). All mutation handlers are defined here and passed as props. Keeps state management simple — no global stores.',NULL,709.3586716666683288,-298.0817106836794891,'app/components/ShrimpApp.tsx');
INSERT INTO Waypoint VALUES('w13','WaypointGraph — React Flow canvas','Code Component','The left-panel component that renders the understanding map as an interactive graph. Uses React Flow with a custom WaypointNode type for type-coloured nodes and drag-to-connect handles. Supports pan, zoom, node drag, edge delete.',NULL,909.538428885152598,-184.6735709643799339,'app/components/WaypointGraph.tsx');
INSERT INTO Waypoint VALUES('w14','WaypointDetail — right panel','Code Component','The right-panel component showing the selected waypoint''s type badge, title, description, notes, and file path (with clipboard copy). Also surfaces Edit and Delete actions. Shows an empty-state prompt when nothing is selected.',NULL,1286.231958365134914,-87.08802775257100848,'app/components/WaypointDetail.tsx');
INSERT INTO Waypoint VALUES('w15','TourBar — tour navigation','Code Component','The top-bar component with tour selector dropdown, Prev/Next/Finish buttons, step counter, and tour editor popup. The editor lets users create and edit tours by adding waypoints in order with up/down reordering.',NULL,1140.152925441994511,-369.7398832609248415,'app/components/TourBar.tsx');
INSERT INTO Waypoint VALUES('w16','WaypointForm — create/edit form','Code Component','Modal form for creating and editing waypoints. Fields: label, type (8 options), description, notes, filePath. Opened from the graph "+ Add Waypoint" button or the detail panel Edit action.',NULL,1291.175234760191188,-202.2816642814374859,'app/components/WaypointForm.tsx');
INSERT INTO Waypoint VALUES('w17','Core data types','Code Component','TypeScript interfaces for the entire app: WaypointType (union of 8 types), Waypoint, WaypointEdge, Tour, AppState. The single source of truth for what every entity is. All components and API routes import from here.',NULL,420.4256147185527653,-313.2642690942656145,'app/lib/types.ts');
INSERT INTO Waypoint VALUES('w18','Prisma schema','Code Component','Defines the SQLite database structure: Waypoint, Edge, Tour, TourWaypoint (join table with order column for preserving tour waypoint sequence). The source of truth for persistence.',NULL,691.0615669798196449,-456.0154606058319473,'prisma/schema.prisma');
INSERT INTO Waypoint VALUES('w19','db-mappers — Prisma to AppState translation','Code Component','The database stores waypoint positions as posX and posY columns. The app expects position as {x, y}. db-mappers translates between the two.',NULL,964.7313456689742,-469.7443635591324095,'app/lib/db-mappers.ts');
INSERT INTO Waypoint VALUES('w20','Playwright tests — not yet written','Test','Acceptance tests to be written using Playwright: (1) persistence — create waypoint, refresh, verify present; (2) tour navigation — step through all waypoints, verify highlight; (3) delete cascade — delete waypoint, verify removed from graph, edges, and tours.','TODO: write before deploying to Vercel for real users',252.1282082640667568,707.0110282151941874,NULL);
INSERT INTO Waypoint VALUES('w21','Manual tour navigation acceptance test','Test','Manual acceptance test: select "How Shrimp Works" tour, advance through all steps, verify each step highlights the correct graph node and shows the correct detail content, confirm the last step shows "Finish".',NULL,499.9970683531804526,708.4151108791078286,NULL);
INSERT INTO Waypoint VALUES('w22','Graph becomes too dense to navigate','Risk','As a project grows, the graph may become cluttered with dozens of overlapping nodes and crossing edges. Mitigation: keep projects to 10-30 waypoints for now. Filtering, search, and grouping are future features.',NULL,148.9071409147943826,-120.6000214524881074,NULL);
INSERT INTO Waypoint VALUES('w23','SQLite not suitable for cloud deployment','Risk','SQLite runs locally and resets on Vercel deployments (ephemeral filesystem). For cloud deployment, migrate to Turso (SQLite-compatible, hosted) or PostgreSQL. Not a concern for local single-user use.','Mitigation: use Turso when ready to deploy',49.71815584468470206,-460.3359826080226185,NULL);
INSERT INTO Waypoint VALUES('w24','Read the spec and constitution before writing components','AI Instruction','INSTRUCTION FOR AI AGENTS: Before writing any component or API route, read specs/001-shrimp-mvp/spec.md, plan.md, and the constitution at .specify/memory/constitution.md. Do not add props, state, or features not defined in the contracts. Follow Principle I (Simplicity) and Principle VIII (Human and Agent Readable).',NULL,-408.3379314951803281,-103.5310323409443925,'.specify/memory/constitution.md');
INSERT INTO Waypoint VALUES('w26','How should waypoints be exported and shared?','Open Question','When a project''s understanding map is ready to share, how does it leave Shrimp? Options: export to JSON, export to Markdown, publish as a read-only URL, push to GitHub wiki, or embed in a README. Not in scope for current phases.',NULL,-7.034319440719926319,702.8276857746367341,NULL);
INSERT INTO Waypoint VALUES('w27','Should Cognitive Tours be a VS Code extension?','Open Question','Would Shrimp be more useful as a VS Code extension (embedded in the editor, direct file access) vs a standalone web app (tool-agnostic, shareable URL) vs a local CLI tool? Each changes the architecture significantly.','Current choice: web app for maximum accessibility',-233.8386308089455384,705.7196384954299901,NULL);
INSERT INTO Waypoint VALUES('w28','How to show file contents in the detail panel?','Open Question','Phase 3 idea: add a "File" tab to the detail panel showing the contents of the linked file. Needs a server-side API route to read files safely. Should it show the full file or just relevant sections? How to handle large files?','Planned for Phase 4',-499.4765530254168767,743.2104462468457768,NULL);
INSERT INTO Waypoint VALUES('w29','Mitigate and repair cognitive debt','Goal',unistr('The overarching purpose of Cognitive Tours — helping developers and teams construct and maintain shared understanding of software systems, so that cognitive and intent debt don''t accumulate and paralyze them.\u000a\u000aStorey (2026): proposes a triple debt model for software health. Technical debt lives in code, cognitive debt lives in people (eroded shared understanding), intent debt lives in artifacts (missing rationale and goals). Cognitive Tours addresses cognitive and in part intent debt.'),unistr('The research motivation for Cognitive Tours\u000a\u000aBackground: \u000a\u000aCheng, Desmond, Storey (2006): Tours is an Eclipse plugin that lets programmers give live technical presentations by combining slideware with guided navigation through code waypoints. The direct ancestor of Shrimp''s tour concept. "Like Routes, but with a tour guide equipped with a flashlight and a dimmer switch."'),-416.8302862998465344,118.9533812476813352,NULL);
INSERT INTO Waypoint VALUES('w-1780379099199','Filter waypoints by type (to reduce clutter)','Feature',unistr('A filter button on the top left of the graph that has a list and toggles for each waypoint type.  Hides nodes of the selected types and their connected edges.  Default all types are shown.  State is saved in ShrimpAPp and passed to WaypointGraph.\u000a\u000aNo API changes — UI only.'),'ShrimpApp.tsx',479.8496675774913456,-92.14261487695324603,'app/components/WaypointGraph.tsx');
INSERT INTO Waypoint VALUES('w-1780409255110','Import Markdown Tours into Graph','Open Question','Could the skill output (markdown tour) be imported into the graph app to create clickable, navigable waypoints automatically? Would close the loop between the dialogue-based authoring approach and the visual navigation layer. Currently these are two separate workflows — import would make them complementary rather than parallel.',NULL,721.1277905821864351,706.7321271190385233,'cognitive-tours-skill.md');
INSERT INTO Waypoint VALUES('w-1780412091739','Deep link to function or symbol in VS Code','Open Question',unistr('Currently waypoints link to a file via vscode://file/path. Could extend this to link to a specific function or symbol using vscode://file/path/to/file.ts#FunctionName. More precise than file-level links but adds maintenance overhead as code changes. Line numbers go stale; symbol names are more stable. Is the added precision worth the maintenance cost?\u000a\u000aFile path: app/components/WaypointDetail.tsx (where the VS Code link is rendered)\u000a\u000aEdges:\u000a\u000aConnect to WaypointDetail.tsx code component — that''s where the link would be implemented\u000aConnect to File Path Links feature node — it''s a direct enhancement of that feature'),NULL,929.402598722832408,692.178316601976121,NULL);
CREATE TABLE IF NOT EXISTS "Edge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "label" TEXT
);
INSERT INTO Edge VALUES('e07','w04','w07','enhanced by');
INSERT INTO Edge VALUES('e08','w08','w13','implemented in');
INSERT INTO Edge VALUES('e09','w10','w18','implemented in');
INSERT INTO Edge VALUES('e10','w11','w12','implemented in');
INSERT INTO Edge VALUES('e15','w18','w19','mapped by');
INSERT INTO Edge VALUES('e17','w12','w13','renders');
INSERT INTO Edge VALUES('e18','w12','w14','renders');
INSERT INTO Edge VALUES('e19','w12','w15','renders');
INSERT INTO Edge VALUES('e20','w12','w16','opens');
INSERT INTO Edge VALUES('e22','w29','w01','motivates');
INSERT INTO Edge VALUES('e25','w23','w10','leads to');
INSERT INTO Edge VALUES('e-1780362941968','w01','w04','addressed by');
INSERT INTO Edge VALUES('e-1780363517566','w07','w14','implemented by');
INSERT INTO Edge VALUES('e-1780363554082','w07','w16','implemented by');
INSERT INTO Edge VALUES('e-1780363871581','w17','w12','typed by');
INSERT INTO Edge VALUES('e-1780364000600','w29','w02','motivates');
INSERT INTO Edge VALUES('e-1780364224479','w01','w06','addressed by');
INSERT INTO Edge VALUES('e-1780364287430','w06','w04','contains');
INSERT INTO Edge VALUES('e-1780364373430','w02','w06','addressed by');
INSERT INTO Edge VALUES('e-1780369216892','w22','w04','leads to');
INSERT INTO Edge VALUES('e-1780369856383','w12','w19','depends on');
INSERT INTO Edge VALUES('e-1780379178300','w04','w-1780379099199','contains');
INSERT INTO Edge VALUES('e-1780379226482','w-1780379099199','w12','implemented by');
INSERT INTO Edge VALUES('e-1780379316397','w-1780379099199','w13','implemented by');
INSERT INTO Edge VALUES('e-1780422467015','w28','w27','related to');
CREATE TABLE IF NOT EXISTS "Tour" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL
);
INSERT INTO Tour VALUES('t01','How Shrimp Works — Architecture of the Code','A guided walkthrough of Shrimp''s component architecture. Start with the data types, follow the state through ShrimpApp, and see how each panel renders.');
INSERT INTO Tour VALUES('t02','Why Shrimp Exists — The Research Story','The philosophical and research motivation for Shrimp. From the triple debt paper through the original Tours plugin to the modern AI-assisted development context.');
INSERT INTO Tour VALUES('t03','Intent-First Development in Practice','How Shrimp was built using intent-first development — constitution, spec, plan, tasks, then code. Each waypoint in this tour is an artifact from that process.');
INSERT INTO Tour VALUES('t05','Risks and Open Questions','A tour of the known risks and unresolved questions in the project. Good for understanding where the boundaries are and what decisions still need to be made.');
INSERT INTO Tour VALUES('t-1780379652948','Start here - overview','A tour to help a newcomer onboard to the project');
CREATE TABLE IF NOT EXISTS "TourWaypoint" (
    "tourId" TEXT NOT NULL,
    "waypointId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    PRIMARY KEY ("tourId", "order"),
    CONSTRAINT "TourWaypoint_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO TourWaypoint VALUES('t02','w29',0);
INSERT INTO TourWaypoint VALUES('t02','w01',1);
INSERT INTO TourWaypoint VALUES('t02','w02',2);
INSERT INTO TourWaypoint VALUES('t02','w04',3);
INSERT INTO TourWaypoint VALUES('t02','w06',4);
INSERT INTO TourWaypoint VALUES('t03','w08',0);
INSERT INTO TourWaypoint VALUES('t03','w09',1);
INSERT INTO TourWaypoint VALUES('t03','w10',2);
INSERT INTO TourWaypoint VALUES('t03','w11',3);
INSERT INTO TourWaypoint VALUES('t05','w22',0);
INSERT INTO TourWaypoint VALUES('t05','w23',1);
INSERT INTO TourWaypoint VALUES('t05','w26',2);
INSERT INTO TourWaypoint VALUES('t05','w27',3);
INSERT INTO TourWaypoint VALUES('t05','w28',4);
INSERT INTO TourWaypoint VALUES('t05','w20',5);
INSERT INTO TourWaypoint VALUES('t01','w17',0);
INSERT INTO TourWaypoint VALUES('t01','w12',1);
INSERT INTO TourWaypoint VALUES('t01','w13',2);
INSERT INTO TourWaypoint VALUES('t01','w14',3);
INSERT INTO TourWaypoint VALUES('t01','w15',4);
INSERT INTO TourWaypoint VALUES('t01','w16',5);
INSERT INTO TourWaypoint VALUES('t01','w18',6);
INSERT INTO TourWaypoint VALUES('t01','w19',7);
INSERT INTO TourWaypoint VALUES('t-1780379652948','w29',0);
INSERT INTO TourWaypoint VALUES('t-1780379652948','w01',1);
INSERT INTO TourWaypoint VALUES('t-1780379652948','w02',2);
INSERT INTO TourWaypoint VALUES('t-1780379652948','w04',3);
INSERT INTO TourWaypoint VALUES('t-1780379652948','w12',4);
INSERT INTO TourWaypoint VALUES('t-1780379652948','w08',5);
INSERT INTO TourWaypoint VALUES('t-1780379652948','w13',6);
INSERT INTO TourWaypoint VALUES('t-1780379652948','w14',7);
INSERT INTO TourWaypoint VALUES('t-1780379652948','w16',8);
INSERT INTO TourWaypoint VALUES('t-1780379652948','w06',9);
INSERT INTO TourWaypoint VALUES('t-1780379652948','w15',10);
INSERT INTO TourWaypoint VALUES('t-1780379652948','w10',11);
INSERT INTO TourWaypoint VALUES('t-1780379652948','w18',12);
INSERT INTO TourWaypoint VALUES('t-1780379652948','w19',13);
CREATE INDEX "TourWaypoint_tourId_idx" ON "TourWaypoint"("tourId");
COMMIT;
