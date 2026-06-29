'use client';

import { useState } from 'react';
import type { Tour, TourStop, Waypoint } from '@/app/lib/types';

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
  onDeleteTour: (id: string) => void;
  waypoints: Waypoint[];
}

interface TourEditorState {
  open: boolean;
  mode: 'create' | 'edit';
  tourId?: string;
  name: string;
  description: string;
  stops: TourStop[];
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
  onDeleteTour,
  waypoints,
}: TourBarProps) {
  const [editor, setEditor] = useState<TourEditorState>({
    open: false,
    mode: 'create',
    name: '',
    description: '',
    stops: [],
  });

  const isLast = activeTourLength > 0 && activeTourStep === activeTourLength - 1;

  const openCreate = () =>
    setEditor({ open: true, mode: 'create', name: '', description: '', stops: [] });

  const openEdit = () => {
    const tour = tours.find(t => t.id === activeTourId);
    if (!tour) return;
    setEditor({
      open: true,
      mode: 'edit',
      tourId: tour.id,
      name: tour.name,
      description: tour.description,
      stops: tour.stops.map(s => ({ ...s })),
    });
  };

  const closeEditor = () => setEditor(e => ({ ...e, open: false }));

  const saveEditor = () => {
    const data = { name: editor.name.trim(), description: editor.description.trim(), stops: editor.stops };
    if (!data.name) return;
    if (editor.mode === 'create') {
      onCreateTour(data);
    } else if (editor.tourId) {
      onUpdateTour(editor.tourId, data);
    }
    closeEditor();
  };

  const addWaypointToTour = (id: string) =>
    setEditor(e => ({ ...e, stops: [...e.stops, { waypointId: id }] }));

  const removeWaypointFromTour = (idx: number) =>
    setEditor(e => ({ ...e, stops: e.stops.filter((_, i) => i !== idx) }));

  const moveWaypoint = (idx: number, dir: -1 | 1) => {
    setEditor(e => {
      const stops = [...e.stops];
      const target = idx + dir;
      if (target < 0 || target >= stops.length) return e;
      [stops[idx], stops[target]] = [stops[target], stops[idx]];
      return { ...e, stops };
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
              {editor.stops.length === 0 && (
                <p className="text-xs text-gray-400">No waypoints added yet.</p>
              )}
              <ul className="flex flex-col gap-1">
                {editor.stops.map((stop, idx) => {
                  const wp = waypoints.find(w => w.id === stop.waypointId);
                  return (
                    <li key={`${stop.waypointId}-${idx}`} className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex-1 truncate">{wp?.label ?? stop.waypointId}</span>
                        <button onClick={() => moveWaypoint(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-30">↑</button>
                        <button onClick={() => moveWaypoint(idx, 1)} disabled={idx === editor.stops.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-30">↓</button>
                        <button onClick={() => removeWaypointFromTour(idx)} className="text-red-400 hover:text-red-600">✕</button>
                      </div>
                      <textarea
                        rows={2}
                        className="text-sm border border-gray-200 rounded px-2 py-1 w-full resize-none"
                        placeholder="Narrative for this stop (optional)"
                        value={stop.narrative ?? ''}
                        onChange={ev => setEditor(ed => {
                          const stops = ed.stops.map((s, i) => i === idx ? { ...s, narrative: ev.target.value } : s);
                          return { ...ed, stops };
                        })}
                      />
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
            <div className="flex gap-2 items-center border-t pt-3">
              {editor.mode === 'edit' && editor.tourId && (
                <button
                  onClick={() => { onDeleteTour(editor.tourId!); closeEditor(); }}
                  className="px-4 py-1.5 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 mr-auto"
                >
                  Delete tour
                </button>
              )}
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
