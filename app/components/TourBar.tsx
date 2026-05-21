'use client';

import { useState } from 'react';
import type { Tour, Waypoint } from '@/app/lib/types';

interface TourBarProps {
  tours: Tour[];
  activeTourId: string | null;
  activeTourStep: number;
  activeTourLength: number;
  onSelectTour: (id: string | null) => void;
  onNext: () => void;
  onPrev: () => void;
  onCreateTour: (data: Omit<Tour, 'id'>) => void;
  onUpdateTour: (id: string, data: Partial<Omit<Tour, 'id'>>) => void;
  waypoints: Waypoint[];
}

interface TourEditorState {
  open: boolean;
  mode: 'create' | 'edit';
  tourId?: string;
  name: string;
  description: string;
  waypointIds: string[];
}

export default function TourBar({
  tours,
  activeTourId,
  activeTourStep,
  activeTourLength,
  onSelectTour,
  onNext,
  onPrev,
  onCreateTour,
  onUpdateTour,
  waypoints,
}: TourBarProps) {
  const [editor, setEditor] = useState<TourEditorState>({
    open: false,
    mode: 'create',
    name: '',
    description: '',
    waypointIds: [],
  });

  const isLast = activeTourLength > 0 && activeTourStep === activeTourLength - 1;

  const openCreate = () =>
    setEditor({ open: true, mode: 'create', name: '', description: '', waypointIds: [] });

  const openEdit = () => {
    const tour = tours.find(t => t.id === activeTourId);
    if (!tour) return;
    setEditor({
      open: true,
      mode: 'edit',
      tourId: tour.id,
      name: tour.name,
      description: tour.description,
      waypointIds: [...tour.waypointIds],
    });
  };

  const closeEditor = () => setEditor(e => ({ ...e, open: false }));

  const saveEditor = () => {
    const data = { name: editor.name.trim(), description: editor.description.trim(), waypointIds: editor.waypointIds };
    if (!data.name) return;
    if (editor.mode === 'create') {
      onCreateTour(data);
    } else if (editor.tourId) {
      onUpdateTour(editor.tourId, data);
    }
    closeEditor();
  };

  const addWaypointToTour = (id: string) =>
    setEditor(e => ({ ...e, waypointIds: [...e.waypointIds, id] }));

  const removeWaypointFromTour = (idx: number) =>
    setEditor(e => ({ ...e, waypointIds: e.waypointIds.filter((_, i) => i !== idx) }));

  const moveWaypoint = (idx: number, dir: -1 | 1) => {
    setEditor(e => {
      const ids = [...e.waypointIds];
      const target = idx + dir;
      if (target < 0 || target >= ids.length) return e;
      [ids[idx], ids[target]] = [ids[target], ids[idx]];
      return { ...e, waypointIds: ids };
    });
  };

  return (
    <>
      <div className="flex items-center gap-3 px-4 h-12 border-b border-gray-200 bg-white shrink-0">
        <select
          className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
          value={activeTourId ?? ''}
          onChange={e => onSelectTour(e.target.value || null)}
        >
          <option value="">No tour selected</option>
          {tours.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        {activeTourId ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              disabled={activeTourStep === 0}
              className="px-2 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-600 tabular-nums">
              Step {activeTourStep + 1} of {activeTourLength}
            </span>
            <button
              onClick={onNext}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
            >
              {isLast ? 'Finish' : 'Next →'}
            </button>
            <button
              onClick={openEdit}
              className="ml-1 px-2 py-1 text-xs border border-gray-200 rounded text-gray-500 hover:bg-gray-50"
            >
              Edit tour
            </button>
          </div>
        ) : null}

        <div className="ml-auto flex gap-2">
          <button
            onClick={openCreate}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            + New Tour
          </button>
        </div>

        <span className="text-xs text-gray-400 hidden sm:block">
          Data resets on refresh · no persistence
        </span>
      </div>

      {editor.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 flex flex-col gap-4">
            <h2 className="text-base font-semibold">
              {editor.mode === 'create' ? 'New Tour' : 'Edit Tour'}
            </h2>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Name *</label>
              <input
                className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                value={editor.name}
                onChange={e => setEditor(ed => ({ ...ed, name: e.target.value }))}
                placeholder="Tour name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Description</label>
              <input
                className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                value={editor.description}
                onChange={e => setEditor(ed => ({ ...ed, description: e.target.value }))}
                placeholder="One-line summary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Waypoints (ordered)</label>
              {editor.waypointIds.length === 0 && (
                <p className="text-xs text-gray-400">No waypoints added yet.</p>
              )}
              <ul className="flex flex-col gap-1">
                {editor.waypointIds.map((wid, idx) => {
                  const wp = waypoints.find(w => w.id === wid);
                  return (
                    <li key={`${wid}-${idx}`} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 truncate">{wp?.label ?? wid}</span>
                      <button onClick={() => moveWaypoint(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-30">↑</button>
                      <button onClick={() => moveWaypoint(idx, 1)} disabled={idx === editor.waypointIds.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-30">↓</button>
                      <button onClick={() => removeWaypointFromTour(idx)} className="text-red-400 hover:text-red-600">✕</button>
                    </li>
                  );
                })}
              </ul>
              <select
                className="text-sm border border-gray-300 rounded px-2 py-1"
                defaultValue=""
                onChange={e => { if (e.target.value) { addWaypointToTour(e.target.value); e.target.value = ''; } }}
              >
                <option value="">Add a waypoint…</option>
                {waypoints.map(w => (
                  <option key={w.id} value={w.id}>{w.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end border-t pt-3">
              <button onClick={closeEditor} className="px-4 py-1.5 text-sm border rounded hover:bg-gray-50">Cancel</button>
              <button
                onClick={saveEditor}
                disabled={!editor.name.trim()}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
