'use client';

import { useState } from 'react';
import type { Waypoint } from '@/app/lib/types';
import { WAYPOINT_COLORS } from '@/app/lib/waypoint-colors';

interface WaypointDetailProps {
  waypoint: Waypoint | null;
  onEdit: (waypoint: Waypoint) => void;
  onDelete: (id: string) => void;
}

export default function WaypointDetail({ waypoint, onEdit, onDelete }: WaypointDetailProps) {
  if (!waypoint) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-gray-400 text-sm">
        Select a waypoint to see its details.
      </div>
    );
  }

  const [copied, setCopied] = useState(false);
  const colorClass = WAYPOINT_COLORS[waypoint.type];

  return (
    <div className="p-4 flex flex-col gap-4">
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
          <button
            onClick={() => {
              navigator.clipboard.writeText(waypoint.filePath!).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="font-mono text-xs text-gray-700 hover:text-blue-600 cursor-pointer text-left break-all"
            title="Click to copy"
          >
            {copied ? <span className="text-green-600 font-sans font-medium">Copied!</span> : waypoint.filePath}
          </button>
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
  );
}
