'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type NodeTypes,
  type NodeProps,
} from '@xyflow/react';
import type { Waypoint, WaypointEdge } from '@/app/lib/types';
import { WAYPOINT_COLORS } from '@/app/lib/waypoint-colors';

type WaypointNodeData = { waypoint: Waypoint };

function WaypointNode({ data, selected }: NodeProps & { data: WaypointNodeData }) {
  const colorClass = WAYPOINT_COLORS[data.waypoint.type];
  return (
    <div
      className={`px-3 py-2 rounded-lg border-2 text-sm font-medium max-w-[180px] shadow-sm ${colorClass} ${
        selected ? 'ring-2 ring-offset-1 ring-blue-500' : ''
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
  onSelectWaypoint: (id: string | null) => void;
  onConnect: (connection: { source: string; target: string }) => void;
  onDeleteEdge: (id: string) => void;
  onDeleteWaypoint: (id: string) => void;
  onNodePositionChange: (id: string, position: { x: number; y: number }) => void;
  onAddWaypointClick: () => void;
}

function Graph({
  waypoints,
  edges,
  selectedWaypointId,
  onSelectWaypoint,
  onConnect,
  onDeleteEdge,
  onNodePositionChange,
  onAddWaypointClick,
}: WaypointGraphProps) {
  const nodes: Node[] = useMemo(
    () =>
      waypoints.map(w => ({
        id: w.id,
        type: 'waypointNode',
        position: w.position,
        data: { waypoint: w },
        selected: w.id === selectedWaypointId,
      })),
    [waypoints, selectedWaypointId]
  );

  const rfEdges: Edge[] = useMemo(
    () => edges.map(e => ({ id: e.id, source: e.source, target: e.target, label: e.label })),
    [edges]
  );

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
      });
    },
    [onDeleteEdge]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target && connection.source !== connection.target) {
        onConnect({ source: connection.source, target: connection.target });
      }
    },
    [onConnect]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectWaypoint(node.id);
    },
    [onSelectWaypoint]
  );

  const onPaneClick = useCallback(() => {
    onSelectWaypoint(null);
  }, [onSelectWaypoint]);

  if (waypoints.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400 flex-col gap-3">
        <p>No waypoints yet.</p>
        <button
          onClick={onAddWaypointClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          Add first waypoint
        </button>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={handleConnect}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      deleteKeyCode="Delete"
    >
      <Background />
      <Controls />
      <div className="absolute top-3 left-3 z-10">
        <button
          onClick={onAddWaypointClick}
          className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm shadow-sm hover:bg-gray-50"
        >
          + Add Waypoint
        </button>
      </div>
    </ReactFlow>
  );
}

export default function WaypointGraph(props: WaypointGraphProps) {
  return (
    <ReactFlowProvider>
      <Graph {...props} />
    </ReactFlowProvider>
  );
}
