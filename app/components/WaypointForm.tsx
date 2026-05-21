'use client';

import { useState } from 'react';
import type { Waypoint, WaypointType } from '@/app/lib/types';

const WAYPOINT_TYPES: WaypointType[] = [
  'User Need',
  'Feature',
  'ADR',
  'Code Component',
  'Test',
  'Risk',
  'AI Instruction',
  'Open Question',
];

interface WaypointFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<Omit<Waypoint, 'id' | 'position'>>;
  onSave: (data: Omit<Waypoint, 'id' | 'position'>) => void;
  onCancel: () => void;
}

export default function WaypointForm({ mode, initialValues, onSave, onCancel }: WaypointFormProps) {
  const [label, setLabel] = useState(initialValues?.label ?? '');
  const [type, setType] = useState<WaypointType | ''>(initialValues?.type ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [notes, setNotes] = useState(initialValues?.notes ?? '');

  const canSave = label.trim() !== '' && type !== '';

  const handleSave = () => {
    if (!canSave) return;
    onSave({ label: label.trim(), type: type as WaypointType, description: description.trim(), notes: notes.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
        <h2 className="text-base font-semibold">
          {mode === 'create' ? 'Add Waypoint' : 'Edit Waypoint'}
        </h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Title *</label>
          <input
            autoFocus
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Short descriptive title"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Type *</label>
          <select
            className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
            value={type}
            onChange={e => setType(e.target.value as WaypointType)}
          >
            <option value="">Select a type…</option>
            {WAYPOINT_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="border border-gray-300 rounded px-3 py-1.5 text-sm resize-none"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this waypoint about?"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            className="border border-gray-300 rounded px-3 py-1.5 text-sm resize-none"
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Supplementary notes"
          />
        </div>

        <div className="flex gap-2 justify-end border-t pt-3">
          <button onClick={onCancel} className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
