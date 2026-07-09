'use client';

import { useState } from 'react';
import type { Waypoint } from '@/app/lib/types';
import { WAYPOINT_COLORS } from '@/app/lib/waypoint-colors';

interface WaypointDetailProps {
  waypoint: Waypoint | null;
  onEdit: (waypoint: Waypoint) => void;
  onDelete: (id: string) => void;
  hasActiveTour: boolean;
  onAddWaypointClick: () => void;
  onCollapse?: () => void;
}

export default function WaypointDetail({
  waypoint,
  onEdit,
  onDelete,
  hasActiveTour,
  onAddWaypointClick,
  onCollapse,
}: WaypointDetailProps) {
  const [copied, setCopied] = useState(false);

  const header = (
    <div className="p-4 border-b border-gray-200 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-gray-900">Waypoint panel</h2>
        {onCollapse && (
          <button
            onClick={onCollapse}
            title="Collapse waypoint panel"
            className="text-gray-400 hover:text-gray-700 text-xs px-1"
          >
            »
          </button>
        )}
      </div>
    </div>
  );

  const addWaypointButton = (
    <button
      onClick={onAddWaypointClick}
      className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs shadow-sm hover:bg-gray-50"
    >
      + Add Waypoint
    </button>
  );

  if (!waypoint) {
    if (hasActiveTour) {
      return (
        <div className="flex flex-col h-full">
          {header}
          <div className="flex flex-1 items-center justify-center p-6 text-center text-gray-400 text-xs">
            Select a waypoint to see its details.
          </div>
          <div className="flex gap-2 p-4 border-t border-gray-200 shrink-0">{addWaypointButton}</div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {header}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 text-xs text-gray-600">
          <h2 className="text-sm font-semibold text-gray-800">Getting oriented</h2>
          <p>
            A <span className="font-medium text-gray-700">waypoint</span> is a single point of
            understanding — a goal, feature, decision, or piece of code worth remembering. A{' '}
            <span className="font-medium text-gray-700">tour</span> strings waypoints together into
            a guided path through intent and implementation.
          </p>
          <p>Select a waypoint to see its details or create a new waypoint.</p>
        </div>
        <div className="flex gap-2 p-4 border-t border-gray-200 shrink-0">{addWaypointButton}</div>
      </div>
    );
  }

  const colorClass = WAYPOINT_COLORS[waypoint.type];

  return (
    <div className="flex flex-col h-full">
      {header}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <span className={`inline-block self-start px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
          {waypoint.type}
        </span>
        <h2 className="text-sm font-semibold text-gray-900 leading-snug">{waypoint.label}</h2>
        {waypoint.description && (
          <p className="text-xs text-gray-700 leading-relaxed">{waypoint.description}</p>
        )}
        {waypoint.notes && (
          <div className="text-xs text-gray-500 border-t pt-3">
            <div className="font-medium text-gray-600 mb-1">Notes</div>
            <p className="leading-relaxed">{waypoint.notes}</p>
          </div>
        )}
        {waypoint.filePath && (
          <div className="text-xs text-gray-500 border-t pt-3">
            <div className="font-medium text-gray-600 mb-1">Linked artifact</div>
            <p className="font-mono text-xs text-gray-700 break-all mb-2">{waypoint.filePath}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(waypoint.filePath!).catch(() => {});
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
              >
                {copied ? <span className="text-green-600 font-medium">Copied!</span> : 'Copy path'}
              </button>
              <a
                href={`vscode://file/Users/mstorey/shrimp-2/${waypoint.filePath}`}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
              >
                Open in VS Code
              </a>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 p-4 border-t border-gray-200 shrink-0">
        <button
          onClick={() => onEdit(waypoint)}
          className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(waypoint.id)}
          className="flex-1 px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
        >
          Delete
        </button>
        {addWaypointButton}
      </div>
    </div>
  );
}
