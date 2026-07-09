'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FilterState, Tour, TourStop, Waypoint, WaypointType } from '@/app/lib/types';
import { WAYPOINT_TYPES } from '@/app/lib/types';
import { WAYPOINT_COLORS } from '@/app/lib/waypoint-colors';
import { generateFullMapMarkdown, generateTourMarkdown, tourSlug } from '@/app/lib/tour-markdown';

const FILTER_PRESETS: { label: string; types: WaypointType[] }[] = [
  { label: 'Intent Layer', types: ['Goal', 'User Need', 'Feature', 'ADR', 'Test', 'AI Instruction'] },
  { label: 'Technical Layer', types: ['ADR', 'Code Component', 'Test', 'Risk'] },
  { label: 'Other', types: ['Open Question', 'Deprecated'] },
];

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
  markdownViewOpen: boolean;
  onToggleMarkdownView: () => void;
  onEditorOpenChange?: (open: boolean) => void;
  narrative?: string;
  filterState: FilterState;
  onFilterChange: (type: WaypointType, visible: boolean) => void;
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
  markdownViewOpen,
  onToggleMarkdownView,
  onEditorOpenChange,
  narrative,
  filterState,
  onFilterChange,
}: TourBarProps) {
  const [editor, setEditor] = useState<TourEditorState>({
    open: false,
    mode: 'create',
    name: '',
    description: '',
    stops: [],
  });
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const hiddenCount = WAYPOINT_TYPES.filter(t => !filterState[t]).length;

  const sortedTours = useMemo(
    () => [...tours].sort((a, b) => a.name.localeCompare(b.name)),
    [tours]
  );

  useEffect(() => {
    if (!filterPanelOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setFilterPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterPanelOpen]);

  useEffect(() => {
    onEditorOpenChange?.(editor.open);
  }, [editor.open, onEditorOpenChange]);

  useEffect(() => {
    if (!editor.open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setEditor(ed => ({ ...ed, open: false }));
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [editor.open]);

  const isLast = activeTourLength > 0 && activeTourStep === activeTourLength - 1;

  const scrollToStop = (index: number) => {
    document.getElementById(`stop-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePrev = () => {
    if (markdownViewOpen && activeTourStep > 0) scrollToStop(activeTourStep - 1);
    onPrev();
  };

  const handleNext = () => {
    if (markdownViewOpen && !isLast) scrollToStop(activeTourStep + 1);
    onNext();
  };

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

  const downloadMarkdown = (markdown: string, filename: string) => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const tour = tours.find(t => t.id === activeTourId);
    if (!tour) return;
    const markdown = generateTourMarkdown(tour, waypoints);
    const filename = `${tourSlug(tour.name)}-${new Date().toISOString().slice(0, 10)}.md`;
    downloadMarkdown(markdown, filename);
  };

  const handleExportFullMap = () => {
    const markdown = generateFullMapMarkdown(waypoints);
    const filename = `full-map-${new Date().toISOString().slice(0, 10)}.md`;
    downloadMarkdown(markdown, filename);
  };

  return (
    <>
      <div className="flex items-center gap-3 px-4 h-14 border-b-2 border-gray-200 bg-slate-50 shrink-0">
        {activeTourId ? (
          <select
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            value={activeTourId ?? ''}
            onChange={e => onSelectTour(e.target.value || null)}
          >
            <option value="">Return to viewing the full map</option>
            {sortedTours.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        ) : (
          <>
            <select
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              value={activeTourId ?? ''}
              onChange={e => onSelectTour(e.target.value || null)}
            >
              <option value="">Full Map -- all waypoints displayed</option>
              {sortedTours.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              onClick={openCreate}
              className="px-2.5 py-1 text-xs font-medium border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
            >
              + New Tour
            </button>
          </>
        )}

        {!markdownViewOpen && (
          <div className="relative" ref={filterPanelRef}>
            <button
              onClick={() => setFilterPanelOpen(o => !o)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm shadow-sm hover:bg-gray-50"
            >
              {hiddenCount > 0 ? `Filter (${hiddenCount} hidden)` : 'Filter'}
            </button>
            {filterPanelOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex flex-col gap-0.5 min-w-[190px] z-10">
                <div className="flex gap-2 px-2 pb-1.5 mb-0.5 border-b border-gray-100">
                  <button
                    onClick={() => WAYPOINT_TYPES.forEach(type => onFilterChange(type, true))}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    onClick={() => WAYPOINT_TYPES.forEach(type => onFilterChange(type, false))}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Select none
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 px-2 pb-1.5 mb-0.5 border-b border-gray-100">
                  {FILTER_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      onClick={() =>
                        WAYPOINT_TYPES.forEach(type => onFilterChange(type, preset.types.includes(type)))
                      }
                      className="text-xs font-medium text-gray-600 border border-gray-200 rounded px-1.5 py-0.5 hover:bg-gray-50"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
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
        )}

        {!activeTourId && (
          <span className="text-base text-red-700 font-bold">Select a tour to begin understanding, or create a new one</span>
        )}

        {!activeTourId && (
          <div className="ml-auto flex gap-2">
            <button
              onClick={handleExportFullMap}
              className="px-2.5 py-1 text-sm font-medium border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-100"
            >
              Export full map ↓
            </button>
          </div>
        )}

        {activeTourId ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={activeTourStep === 0}
              className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-100 text-gray-700"
            >
              ← Prev
            </button>
            <span className="text-sm font-medium text-gray-700 tabular-nums">
              Step {activeTourStep + 1} of {activeTourLength}
            </span>
            <button
              onClick={handleNext}
              className={`px-3 py-1.5 text-sm font-semibold text-white rounded-md shadow-sm ${
                isLast ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isLast ? 'Finish' : 'Next →'}
            </button>
            <button
              onClick={openEdit}
              className="ml-1 px-2.5 py-1 text-xs font-medium border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-100"
            >
              Edit tour
            </button>
            <button
              onClick={openCreate}
              className="px-2.5 py-1 text-xs font-medium border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
            >
              + New Tour
            </button>
            <button
              onClick={onToggleMarkdownView}
              className="px-2.5 py-1 text-xs font-medium border border-blue-400 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
            >
              {markdownViewOpen ? 'Graph View' : 'Markdown View'}
            </button>
          </div>
        ) : null}

        {activeTourId && (
          <div className="ml-auto flex gap-2">
            <button
              onClick={handleExport}
              className="px-2.5 py-1 text-sm font-medium border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-100"
            >
              Export tour ↓
            </button>
          </div>
        )}


      </div>

      {!markdownViewOpen && narrative?.trim() && (
        <div data-testid="docent-narrative-bar" className="bg-red-50 border-b-2 border-red-400 text-base text-red-800 px-4 py-3 shrink-0">
          <span className="font-bold">Next: </span>
          {narrative}
        </div>
      )}

      {editor.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <h2 className="text-base font-semibold px-6 pt-6 pb-4 shrink-0">
              {editor.mode === 'create' ? 'New Tour' : 'Edit Tour'}
            </h2>
            <div className="flex flex-col gap-4 px-6 pb-4 overflow-y-auto">
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
                        <span className="flex-1 truncate">
                          <span className="text-gray-400 font-normal">Stop {idx + 1}: </span>
                          {wp?.label ?? stop.waypointId}
                          {wp && <span className="text-gray-400 font-normal"> ({wp.type})</span>}
                        </span>
                        <button onClick={() => moveWaypoint(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-30">↑</button>
                        <button onClick={() => moveWaypoint(idx, 1)} disabled={idx === editor.stops.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-30">↓</button>
                        <button onClick={() => removeWaypointFromTour(idx)} className="text-red-400 hover:text-red-600">✕</button>
                      </div>
                      <span className="text-xs font-bold text-gray-700">Next stop commentary:</span>
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
                {[...waypoints].sort((a, b) => a.label.localeCompare(b.label)).map(w => (
                  <option key={w.id} value={w.id}>{w.label}</option>
                ))}
              </select>
            </div>
            </div>
            <div className="flex gap-2 items-center border-t px-6 py-4 shrink-0">
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
