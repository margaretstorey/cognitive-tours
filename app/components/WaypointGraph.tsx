'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  useReactFlow,
  getViewportForBounds,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type NodeTypes,
  type NodeProps,
} from '@xyflow/react';
import type { Waypoint, WaypointEdge, FilterState } from '@/app/lib/types';
import { WAYPOINT_COLORS } from '@/app/lib/waypoint-colors';
import { WaypointTypeIcon } from '@/app/lib/waypoint-icons';
import { CopyCommand, PLUGIN_INSTALL_URL, skillCommand, useSiteOrigin } from '@/app/components/ClaudeCodePanel';

type WaypointNodeData = { waypoint: Waypoint; isActiveTourStep: boolean; isCurrentMatch: boolean; isNew: boolean };

function WaypointNode({ data, selected }: NodeProps & { data: WaypointNodeData }) {
  const colorClass = WAYPOINT_COLORS[data.waypoint.type];
  return (
    <div
      data-current-stop={data.isActiveTourStep ? 'true' : undefined}
      data-current-match={data.isCurrentMatch ? 'true' : undefined}
      data-new={data.isNew ? 'true' : undefined}
      title={data.isNew ? 'New: click it, or double-click to write its description' : undefined}
      // nopan: React Flow's double-click zoom skips nodes, so a double-click
      // opens the edit form without also zooming in. Wheel zoom still works.
      className={`nopan px-3 py-2 rounded-lg border-2 transition-transform text-sm font-medium max-w-[180px] shadow-sm ${colorClass} ${
        data.isActiveTourStep || data.isCurrentMatch
          ? 'scale-[1.2] ring-[6px] ring-offset-2 ring-blue-500 shadow-xl shadow-blue-500/60'
          : data.isNew
            // Red "new" halo: added since this browser last looked (app/lib/seen.ts).
            ? 'ring-4 ring-offset-2 ring-red-500 shadow-lg shadow-red-500/60'
            : selected ? 'ring-2 ring-offset-1 ring-blue-500' : ''
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <div className="flex items-center gap-1 text-xs mb-0.5">
        <WaypointTypeIcon type={data.waypoint.type} />
        <span className="opacity-60">{data.waypoint.type}</span>
      </div>
      <div className="leading-tight">{data.waypoint.label}</div>
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />
    </div>
  );
}

const nodeTypes: NodeTypes = { waypointNode: WaypointNode as React.ComponentType<NodeProps> };

interface WaypointGraphProps {
  waypoints: Waypoint[];
  edges: WaypointEdge[];
  selectedWaypointId: string | null;
  activeTourWaypointIds: string[];
  onSelectWaypoint: (id: string | null) => void;
  /** Double-clicking a node opens its edit form. */
  onEditWaypoint: (id: string) => void;
  onConnect: (connection: { source: string; target: string; label?: string }) => void;
  onDeleteEdge: (id: string) => void;
  onDeleteWaypoint: (id: string) => void;
  onNodePositionChange: (id: string, position: { x: number; y: number }) => void;
  onAddWaypointClick: () => void;
  filterState: FilterState;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  tourName?: string;
  tourDescription?: string;
  panelCollapsed?: boolean;
  /** While a tour is active: true fits every stop, false follows the current stop. */
  tourOverview?: boolean;
  /** Filled in by the graph: where a new waypoint should go, in map coordinates (null while the map isn't shown). */
  placementRef?: React.MutableRefObject<(() => { x: number; y: number } | null) | null>;
  /** New to this browser and not yet described: drawn with a red halo. */
  isNewWaypoint?: (w: Waypoint) => boolean;
}

// Roughly a waypoint node's size on screen at zoom 1 (nodes are max-w-[180px]),
// used to keep a newly placed node fully inside the visible map.
const NEW_NODE_WIDTH = 180;
const NEW_NODE_HEIGHT = 60;
const NEW_NODE_MARGIN = 16;

function Graph({
  waypoints,
  edges,
  selectedWaypointId,
  activeTourWaypointIds,
  onSelectWaypoint,
  onEditWaypoint,
  onConnect,
  onDeleteEdge,
  onNodePositionChange,
  onAddWaypointClick,
  filterState,
  searchQuery,
  onSearchChange,
  tourName,
  tourDescription,
  panelCollapsed,
  tourOverview = false,
  placementRef,
  isNewWaypoint,
}: WaypointGraphProps) {
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const { getNodesBounds, setViewport, setCenter, getInternalNode, getViewport, screenToFlowPosition, getNodes } = useReactFlow();
  const paneRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  // Last cursor position over the map, in window coordinates, and whether it
  // was over the canvas's own controls (+ Add Waypoint, Search).
  const lastCursorRef = useRef<{ x: number; y: number; overControls: boolean } | null>(null);

  const onPaneMouseMove = useCallback((e: React.MouseEvent) => {
    const overControls = e.target instanceof Element && !!controlsRef.current?.contains(e.target);
    lastCursorRef.current = { x: e.clientX, y: e.clientY, overControls };
  }, []);

  // A new waypoint goes under the cursor's last position on the map; just
  // below the canvas controls if that's where the cursor was (the canvas's
  // + Add Waypoint); or in the middle of the view if the cursor never came
  // over the map. Always kept fully inside the visible map.
  useEffect(() => {
    if (!placementRef) return;
    placementRef.current = () => {
      // Not mounted while the map is empty ("Add first waypoint" screen).
      if (!paneRef.current) return null;
      const pane = paneRef.current.getBoundingClientRect();
      const { zoom } = getViewport();
      const w = NEW_NODE_WIDTH * zoom;
      const h = NEW_NODE_HEIGHT * zoom;
      const cursor = lastCursorRef.current;
      let left: number;
      let top: number;
      if (cursor?.overControls && controlsRef.current) {
        const controls = controlsRef.current.getBoundingClientRect();
        left = controls.right - w;
        top = controls.bottom + NEW_NODE_MARGIN;
      } else if (cursor) {
        left = cursor.x - w / 2;
        top = cursor.y - h / 2;
      } else {
        left = pane.left + (pane.width - w) / 2;
        top = pane.top + (pane.height - h) / 2;
      }
      left = Math.max(pane.left + NEW_NODE_MARGIN, Math.min(left, pane.right - w - NEW_NODE_MARGIN));
      top = Math.max(pane.top + NEW_NODE_MARGIN, Math.min(top, pane.bottom - h - NEW_NODE_MARGIN));
      const position = screenToFlowPosition({ x: left, y: top });
      // Adding several waypoints in a row from the same spot stacks them in
      // a column rather than exactly on top of each other.
      const taken = (p: { x: number; y: number }) =>
        getNodes().some(
          n => Math.abs(n.position.x - p.x) < NEW_NODE_WIDTH / 2 && Math.abs(n.position.y - p.y) < NEW_NODE_HEIGHT,
        );
      for (let i = 0; i < 20 && taken(position); i++) position.y += NEW_NODE_HEIGHT + NEW_NODE_MARGIN;
      return position;
    };
    return () => {
      placementRef.current = null;
    };
  }, [placementRef, getViewport, screenToFlowPosition, getNodes]);

  // Only the type filter hides waypoints; search highlights instead.
  const hiddenNodeIds = useMemo(
    () => new Set(waypoints.filter(w => !filterState[w.type]).map(w => w.id)),
    [waypoints, filterState]
  );

  // Visible waypoints whose label contains the query, alphabetical like the
  // tour stop picker.
  const matchesFor = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      return waypoints
        .filter(w => filterState[w.type] && w.label.toLowerCase().includes(q))
        .sort((a, b) => a.label.localeCompare(b.label))
        .map(w => w.id);
    },
    [waypoints, filterState]
  );
  const matchIds = useMemo(() => matchesFor(searchQuery), [matchesFor, searchQuery]);
  // Which match is current; a new query starts again at the first.
  const [matchCursor, setMatchCursor] = useState({ query: '', index: 0 });
  const matchIndex =
    matchCursor.query === searchQuery && matchCursor.index < matchIds.length ? matchCursor.index : 0;
  const currentMatchId = matchIds[matchIndex] ?? null;
  const searching = matchIds.length > 0;

  const onSearchInput = useCallback(
    (query: string) => {
      onSearchChange(query);
      const first = matchesFor(query)[0];
      if (first) onSelectWaypoint(first);
    },
    [onSearchChange, matchesFor, onSelectWaypoint]
  );

  const stepMatch = useCallback(
    (delta: number) => {
      if (matchIds.length === 0) return;
      const index = (matchIndex + delta + matchIds.length) % matchIds.length;
      setMatchCursor({ query: searchQuery, index });
      onSelectWaypoint(matchIds[index]);
    },
    [matchIds, matchIndex, searchQuery, onSelectWaypoint]
  );

  const nodes: Node[] = useMemo(
    () =>
      waypoints
        .filter(w => !hiddenNodeIds.has(w.id))
        .map(w => {
          // A search with matches takes over the tour's spotlight.
          const inTour = !searching && activeTourWaypointIds.length > 0;
          const isCurrentStop = inTour && w.id === selectedWaypointId;
          const isCurrentMatch = w.id === currentMatchId;
          // Spotlight: the current stop (or match) leads, other stops (or
          // matches) recede, and everything else fades furthest.
          const opacity = searching
            ? isCurrentMatch ? undefined : matchIds.includes(w.id) ? 0.85 : 0.2
            : !inTour || isCurrentStop
              ? undefined
              : activeTourWaypointIds.includes(w.id) ? 0.85 : 0.2;
          return {
            id: w.id,
            type: 'waypointNode',
            position: w.position,
            data: { waypoint: w, isActiveTourStep: isCurrentStop, isCurrentMatch, isNew: isNewWaypoint?.(w) ?? false },
            selected: w.id === selectedWaypointId,
            // Draw the enlarged current stop above neighbours it grows into.
            zIndex: isCurrentStop || isCurrentMatch ? 1000 : undefined,
            style: opacity !== undefined ? { opacity } : undefined,
          };
        }),
    [waypoints, selectedWaypointId, activeTourWaypointIds, hiddenNodeIds, searching, currentMatchId, matchIds, isNewWaypoint]
  );

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const tourKey = activeTourWaypointIds.join(',');
  // The stop to follow: only when a tour is active, not in overview, and the
  // selection is one of the tour's stops (a suspended tour selects other nodes).
  const followStopId =
    tourKey && !tourOverview && selectedWaypointId && activeTourWaypointIds.includes(selectedWaypointId)
      ? selectedWaypointId
      : null;
  // Clearing a search leaves the camera where the search put it.
  const searchHadFocusRef = useRef(false);

  useEffect(() => {
    if (!currentMatchId && searchHadFocusRef.current) {
      searchHadFocusRef.current = false;
      return;
    }
    searchHadFocusRef.current = !!currentMatchId;
    const focusId = currentMatchId ?? followStopId;
    // Wait a couple of frames so the tour header (whose height varies with
    // description length, and disappears entirely in full-map mode) has
    // finished resizing the canvas before we measure it.
    //
    // We deliberately use getNodesBounds + setViewport here instead of the
    // fitView() helper: fitView() only takes effect the next time React Flow
    // internally processes a node update (a nodes-prop sync or a per-node
    // resize) — if nothing else happens to trigger that afterward, the fit
    // silently never applies. setViewport() applies immediately.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const container = paneRef.current;
        if (!container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width === 0 || height === 0) return;

        if (focusId) {
          // Center the current stop (or search match) at a readable zoom: zoom
          // in to at least 1.0 if zoomed out, but don't push an already-close
          // view further.
          const node = getInternalNode(focusId);
          if (node) {
            const { x, y } = node.internals.positionAbsolute;
            const w = node.measured.width ?? 0;
            const h = node.measured.height ?? 0;
            const zoom = Math.min(1.5, Math.max(1, getViewport().zoom));
            setCenter(x + w / 2, y + h / 2, { zoom, duration: 400 });
            return;
          }
        }

        const ids = tourKey ? tourKey.split(',') : nodesRef.current.map(n => n.id);
        if (ids.length === 0) return;

        const bounds = getNodesBounds(ids);
        if (bounds.width === 0 && bounds.height === 0) return;

        const padding = tourKey
          ? ({ top: '10%', bottom: '30%', left: '5%', right: '5%' } as const)
          : ({ top: '8%', bottom: '8%', left: '5%', right: '5%' } as const);
        const viewport = getViewportForBounds(bounds, width, height, 0.05, 1.5, padding);
        setViewport(viewport, { duration: 400 });
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [tourKey, followStopId, currentMatchId, filterState, panelCollapsed, getNodesBounds, setViewport, setCenter, getInternalNode, getViewport]);

  const rfEdges: Edge[] = useMemo(
    () =>
      edges
        .filter(e => !hiddenNodeIds.has(e.source) && !hiddenNodeIds.has(e.target))
        .map(e => {
          // Full strength only between two matches (or two tour stops).
          const lit = searching ? matchIds : activeTourWaypointIds;
          const dimmed = lit.length > 0 && !(lit.includes(e.source) && lit.includes(e.target));
          return {
            id: e.id,
            source: e.source,
            target: e.target,
            label: dimmed ? undefined : e.label,
            selected: e.id === selectedEdgeId,
            style: dimmed ? { opacity: 0.2 } : undefined,
          };
        }),
    [edges, activeTourWaypointIds, selectedEdgeId, hiddenNodeIds, searching, matchIds]
  );

  const [pendingConnection, setPendingConnection] = useState<{ source: string; target: string } | null>(null);
  const [pendingLabel, setPendingLabel] = useState('');

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach(change => {
        if (change.type === 'position' && change.position) {
          onNodePositionChange(change.id, change.position);
        }
      });
    },
    [onNodePositionChange]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      changes.forEach(change => {
        if (change.type === 'remove') onDeleteEdge(change.id);
        if (change.type === 'select') setSelectedEdgeId(change.selected ? change.id : null);
      });
    },
    [onDeleteEdge]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target && connection.source !== connection.target) {
        setPendingConnection({ source: connection.source, target: connection.target });
        setPendingLabel('');
      }
    },
    []
  );

  const confirmConnect = useCallback(() => {
    if (!pendingConnection) return;
    onConnect({ ...pendingConnection, label: pendingLabel.trim() || undefined });
    setPendingConnection(null);
  }, [pendingConnection, pendingLabel, onConnect]);

  const cancelConnect = useCallback(() => {
    setPendingConnection(null);
  }, []);

  // Clicking a waypoint or empty canvas also ends a search, so there's no
  // box to clear.
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectWaypoint(node.id);
      if (searchQuery) onSearchChange('');
    },
    [onSelectWaypoint, searchQuery, onSearchChange]
  );

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => onEditWaypoint(node.id),
    [onEditWaypoint]
  );

  const onPaneClick = useCallback(() => {
    onSelectWaypoint(null);
    if (searchQuery) onSearchChange('');
  }, [onSelectWaypoint, searchQuery, onSearchChange]);

  const onEdgeDoubleClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      onDeleteEdge(edge.id);
    },
    [onDeleteEdge]
  );

  const tourHeader = tourName && (
    <div data-testid="tour-header" className="shrink-0 bg-white border-b border-gray-200 px-4 py-3 text-center">
      <h2 className="text-2xl font-bold text-gray-900">{tourName}</h2>
      {tourDescription?.trim() && (
        <p className="text-gray-600 mt-1">
          <span className="font-bold">Tour Description: </span>
          {tourDescription}
        </p>
      )}
    </div>
  );

  if (waypoints.length === 0) {
    return (
      <div className="h-full w-full flex flex-col">
        {tourHeader}
        <div className="flex-1 min-h-0 overflow-y-auto flex items-center justify-start pt-16 pb-8 px-4 text-gray-400 flex-col gap-3">
          <p>No waypoints yet.</p>
          <FirstToursCard />
          <p className="mt-2 text-gray-500">Or manually start adding waypoints:</p>
          <button
            onClick={onAddWaypointClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Add first waypoint
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      {tourHeader}
      <div className="flex-1 min-h-0 relative" ref={paneRef} onMouseMove={onPaneMouseMove}>
        <ReactFlow
          nodes={nodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onPaneClick={onPaneClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          deleteKeyCode={null}
        >
          <Background />
          <Controls />
          {/* Add Waypoint lives on the canvas too, so it stays reachable when
              the waypoint panel is collapsed (e.g. while a tour is selected). */}
          <div ref={controlsRef} className="absolute top-3 right-3 z-10 flex gap-2">
            <button
              onClick={onAddWaypointClick}
              data-testid="canvas-add-waypoint"
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm shadow-sm hover:bg-gray-50"
            >
              + Add Waypoint
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') stepMatch(e.shiftKey ? -1 : 1);
                if (e.key === 'Escape') onSearchChange('');
              }}
              placeholder="Search…"
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm shadow-sm w-40 focus:outline-none focus:border-gray-400"
            />
            {searchQuery.trim() && (
              <div
                data-testid="search-counter"
                className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-lg text-sm shadow-sm"
              >
                {searching ? (
                  <>
                    <button onClick={() => stepMatch(-1)} aria-label="Previous match" className="px-1 hover:text-blue-600">
                      ‹
                    </button>
                    <span className="tabular-nums whitespace-nowrap">
                      {matchIndex + 1} of {matchIds.length}
                    </span>
                    <button onClick={() => stepMatch(1)} aria-label="Next match" className="px-1 hover:text-blue-600">
                      ›
                    </button>
                  </>
                ) : (
                  <span className="text-gray-500 whitespace-nowrap">No matches</span>
                )}
                <button
                  onClick={() => onSearchChange('')}
                  aria-label="Exit search"
                  title="Exit search"
                  className="px-1 ml-1 text-gray-400 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          {pendingConnection && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
              <div className="bg-white rounded-xl shadow-xl p-5 flex flex-col gap-3 w-72">
                <p className="text-sm font-medium text-gray-800">Add a label to this connection</p>
                <input
                  autoFocus
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                  value={pendingLabel}
                  onChange={e => setPendingLabel(e.target.value)}
                  placeholder="e.g. depends on, implements… (optional)"
                  onKeyDown={e => {
                    if (e.key === 'Enter') confirmConnect();
                    if (e.key === 'Escape') cancelConnect();
                  }}
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={cancelConnect} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">
                    Cancel
                  </button>
                  <button onClick={confirmConnect} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                    Add Connection
                  </button>
                </div>
              </div>
            </div>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}

// Empty-map pointer to the first-tours skill in the Cognitive Tours plugin
// for Claude Code (plugins/cognitive-tours). A web page can't run a skill
// (it runs in the user's terminal, in their checkout), so this copies the
// command with this site's address filled in. The header's "Claude Code
// skills" panel (ClaudeCodePanel.tsx) lists all five the same way.
function FirstToursCard() {
  const origin = useSiteOrigin();

  return (
    <section
      aria-label="Don't start from a blank page"
      className="mt-2 w-full max-w-md rounded-lg border border-gray-200 bg-white p-4 text-left text-sm text-gray-700"
    >
      <h2 className="text-base font-semibold text-gray-900">Don&apos;t start from a blank page</h2>
      <p className="mt-2">
        New to this repo? Open Claude Code inside it and run the <code>first-tours</code>{' '}skill. It reads the
        code and docs, then adds a starting map here: about a dozen waypoints and two short tours
        (one from the user&apos;s side, one from the builder&apos;s; at most 8 stops each).
      </p>
      <p className="mt-2">
        It shows you the plan before adding anything, and marks everything it adds as drafted by
        Claude, for you to check and rewrite in your own words.
      </p>
      <div className="mt-3">
        <CopyCommand
          command={skillCommand('first-tours', origin)}
          testId="first-tours-command"
          copyLabel="Copy command"
        />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Needs the{' '}
        <a href={PLUGIN_INSTALL_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">
          Cognitive Tours plugin
        </a>{' '}
        for Claude Code. The skill offers to remember this site, so later skills need only{' '}
        <code>/cognitive-tours:</code> and their name. This card only appears while the map is
        completely empty.
      </p>
    </section>
  );
}

export default function WaypointGraph(props: WaypointGraphProps) {
  return (
    <ReactFlowProvider>
      <Graph {...props} />
    </ReactFlowProvider>
  );
}
