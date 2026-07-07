'use client';

import { useState } from 'react';
import type { FilterState, Waypoint, WaypointType } from '@/app/lib/types';
import { WAYPOINT_TYPES } from '@/app/lib/types';
import { WAYPOINT_COLORS } from '@/app/lib/waypoint-colors';

interface WaypointDetailProps {
  waypoint: Waypoint | null;
  onEdit: (waypoint: Waypoint) => void;
  onDelete: (id: string) => void;
  hasActiveTour: boolean;
  onAddWaypointClick: () => void;
  filterState: FilterState;
  onFilterChange: (type: WaypointType, visible: boolean) => void;
  onCollapse?: () => void;
}

export default function WaypointDetail({
  waypoint,
  onEdit,
  onDelete,
  hasActiveTour,
  onAddWaypointClick,
  filterState,
  onFilterChange,
  onCollapse,
}: WaypointDetailProps) {
  const [copied, setCopied] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const hiddenCount = WAYPOINT_TYPES.filter(t => !filterState[t]).length;

  const header = (
    <div className="p-4 border-b border-gray-200 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">Waypoint panel</h2>
        {onCollapse && (
          <button
            onClick={onCollapse}
            title="Collapse waypoint panel"
            className="text-gray-400 hover:text-gray-700 text-sm px-1"
          >
            »
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onAddWaypointClick}
          className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm shadow-sm hover:bg-gray-50"
        >
          + Add Waypoint
        </button>
        <div className="relative">
          <button
            onClick={() => setFilterPanelOpen(o => !o)}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm shadow-sm hover:bg-gray-50"
          >
            {hiddenCount > 0 ? `Filter (${hiddenCount} hidden)` : 'Filter'}
          </button>
          {filterPanelOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex flex-col gap-0.5 min-w-[190px] z-10">
              {WAYPOINT_TYPES.map(type => (
                <label
                  key={type}
                  className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filterState[type]}
                    onChange={e => onFilterChange(type, e.target.checked)}
                    className="rounded"
                  />
                  <span className={`inline-block w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${WAYPOINT_COLORS[type]}`} />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!waypoint) {
    if (hasActiveTour) {
      return (
        <div className="flex flex-col h-full">
          {header}
          <div className="flex flex-1 items-center justify-center p-6 text-center text-gray-400 text-sm">
            Select a waypoint to see its details.
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {header}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 text-sm text-gray-600">
          <h2 className="text-base font-semibold text-gray-800">Getting oriented</h2>
          <p>
            A <span className="font-medium text-gray-700">waypoint</span> is a single point of
            understanding — a goal, feature, decision, or piece of code worth remembering. A{' '}
            <span className="font-medium text-gray-700">tour</span> strings waypoints together into
            a guided path through intent and implementation.
          </p>
          <p>Select a waypoint to see its details or create a new waypoint.</p>
        </div>
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
        <h2 className="text-base font-semibold text-gray-900 leading-snug">{waypoint.label}</h2>
        {waypoint.description && (
          <p className="text-sm text-gray-700 leading-relaxed">{waypoint.description}</p>
        )}
        {waypoint.notes && (
          <div className="text-sm text-gray-500 border-t pt-3">
            <div className="font-medium text-gray-600 mb-1">Notes</div>
            <p className="leading-relaxed">{waypoint.notes}</p>
          </div>
        )}
        {waypoint.filePath && (
          <div className="text-sm text-gray-500 border-t pt-3">
            <div className="font-medium text-gray-600 mb-1">File Path</div>
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
        <div className="flex gap-2 border-t pt-3">
          <button
            onClick={() => onEdit(waypoint)}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(waypoint.id)}
            className="flex-1 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
