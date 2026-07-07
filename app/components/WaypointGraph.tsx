'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
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
      className={`px-3 py-2 rounded-lg border-2 text-sm font-medium max-w-[180px] shadow-sm ${colorClass} ${
        data.isActiveTourStep
          ? 'ring-4 ring-offset-2 ring-blue-500 shadow-lg shadow-blue-400/50'
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
}: WaypointGraphProps) {
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

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
        .map(w => ({
          id: w.id,
          type: 'waypointNode',
          position: w.position,
          data: {
            waypoint: w,
            isActiveTourStep: activeTourWaypointIds.length > 0 && w.id === selectedWaypointId,
          },
          selected: w.id === selectedWaypointId,
          style:
            activeTourWaypointIds.length > 0 && !activeTourWaypointIds.includes(w.id)
              ? { opacity: 0.2 }
              : undefined,
        })),
    [waypoints, selectedWaypointId, activeTourWaypointIds, hiddenNodeIds]
  );

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
    <div data-testid="tour-header" className="shrink-0 bg-white border-b border-gray-200 px-4 py-3 text-left">
      <h2 className="text-lg font-bold text-gray-900">{tourName}</h2>
      {tourDescription?.trim() && (
        <p className="text-sm text-gray-600 mt-1">
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
      <div className="flex-1 min-h-0 relative">
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
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search…"
              className="ml-auto px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm shadow-sm w-40 focus:outline-none focus:border-gray-400"
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
