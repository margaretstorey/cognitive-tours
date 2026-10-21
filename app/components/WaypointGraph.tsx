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

type WaypointNodeData = { waypoint: Waypoint; isActiveTourStep: boolean };

function WaypointNode({ data, selected }: NodeProps & { data: WaypointNodeData }) {
  const colorClass = WAYPOINT_COLORS[data.waypoint.type];
  return (
    <div
      data-current-stop={data.isActiveTourStep ? 'true' : undefined}
      className={`px-3 py-2 rounded-lg border-2 transition-transform text-sm font-medium max-w-[180px] shadow-sm ${colorClass} ${
        data.isActiveTourStep
          ? 'scale-[1.2] ring-[6px] ring-offset-2 ring-blue-500 shadow-xl shadow-blue-500/60'
          : selected ? 'ring-2 ring-offset-1 ring-blue-500' : ''
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <div className="text-xs opacity-60 mb-0.5">{data.waypoint.type}</div>
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
}

function Graph({
  waypoints,
  edges,
  selectedWaypointId,
  activeTourWaypointIds,
  onSelectWaypoint,
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
}: WaypointGraphProps) {
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const { getNodesBounds, setViewport, setCenter, getInternalNode, getViewport } = useReactFlow();
  const paneRef = useRef<HTMLDivElement>(null);

  const hiddenNodeIds = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return new Set(
      waypoints
        .filter(w => !filterState[w.type] || (q && !w.label.toLowerCase().includes(q)))
        .map(w => w.id)
    );
  }, [waypoints, filterState, searchQuery]);

  const nodes: Node[] = useMemo(
    () =>
      waypoints
        .filter(w => !hiddenNodeIds.has(w.id))
        .map(w => {
          const inTour = activeTourWaypointIds.length > 0;
          const isCurrentStop = inTour && w.id === selectedWaypointId;
          // Spotlight: the current stop leads, other stops recede, and
          // waypoints outside the tour fade furthest.
          const opacity = !inTour || isCurrentStop
            ? undefined
            : activeTourWaypointIds.includes(w.id) ? 0.5 : 0.2;
          return {
            id: w.id,
            type: 'waypointNode',
            position: w.position,
            data: { waypoint: w, isActiveTourStep: isCurrentStop },
            selected: w.id === selectedWaypointId,
            // Draw the enlarged current stop above neighbours it grows into.
            zIndex: isCurrentStop ? 1000 : undefined,
            style: opacity !== undefined ? { opacity } : undefined,
          };
        }),
    [waypoints, selectedWaypointId, activeTourWaypointIds, hiddenNodeIds]
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

  useEffect(() => {
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

        if (followStopId) {
          // Center the current stop at a readable zoom: zoom in to at least
          // 1.0 if zoomed out, but don't push an already-close view further.
          const node = getInternalNode(followStopId);
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
  }, [tourKey, followStopId, filterState, panelCollapsed, getNodesBounds, setViewport, setCenter, getInternalNode, getViewport]);

  const rfEdges: Edge[] = useMemo(
    () =>
      edges
        .filter(e => !hiddenNodeIds.has(e.source) && !hiddenNodeIds.has(e.target))
        .map(e => {
          const dimmed =
            activeTourWaypointIds.length > 0 &&
            !(activeTourWaypointIds.includes(e.source) && activeTourWaypointIds.includes(e.target));
          return {
            id: e.id,
            source: e.source,
            target: e.target,
            label: dimmed ? undefined : e.label,
            selected: e.id === selectedEdgeId,
            style: dimmed ? { opacity: 0.2 } : undefined,
          };
        }),
    [edges, activeTourWaypointIds, selectedEdgeId, hiddenNodeIds]
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

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectWaypoint(node.id);
    },
    [onSelectWaypoint]
  );

  const onPaneClick = useCallback(() => {
    onSelectWaypoint(null);
  }, [onSelectWaypoint]);

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
        <div className="flex-1 min-h-0 flex items-center justify-center text-gray-400 flex-col gap-3">
          <p>No waypoints yet.</p>
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
      <div className="flex-1 min-h-0 relative" ref={paneRef}>
        <ReactFlow
          nodes={nodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeClick={onNodeClick}
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
          <div className="absolute top-3 right-3 z-10 flex gap-2">
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
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search…"
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm shadow-sm w-40 focus:outline-none focus:border-gray-400"
            />
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

export default function WaypointGraph(props: WaypointGraphProps) {
  return (
    <ReactFlowProvider>
      <Graph {...props} />
    </ReactFlowProvider>
  );
}
