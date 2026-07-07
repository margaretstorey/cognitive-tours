'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Waypoint, WaypointEdge, Tour, FilterState } from '@/app/lib/types';
import { WAYPOINT_TYPES } from '@/app/lib/types';
import WaypointGraph from './WaypointGraph';
import WaypointDetail from './WaypointDetail';
import TourBar from './TourBar';
import TourMarkdownView from './TourMarkdownView';
import WaypointForm from './WaypointForm';

type FormState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; waypoint: Waypoint };

type LoadState = 'loading' | 'ready' | 'error';

interface BulkDataResponse {
  waypoints: Waypoint[];
  edges: WaypointEdge[];
  tours: Tour[];
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

const DEFAULT_FILTER_STATE: FilterState = Object.fromEntries(
  WAYPOINT_TYPES.map(t => [t, true])
) as FilterState;

async function apiFetch(url: string, options: RequestInit): Promise<void> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export default function CognitiveToursApp() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [edges, setEdges] = useState<WaypointEdge[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(null);
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const [activeTourStep, setActiveTourStepRaw] = useState<number>(0);
  const [form, setForm] = useState<FormState>({ open: false });
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [searchQuery, setSearchQuery] = useState('');
  const [markdownViewOpen, setMarkdownViewOpen] = useState(false);
  const [tourEditorOpen, setTourEditorOpen] = useState(false);
  // Per-node debounce map for position changes (onNodesChange fires on every drag frame).
  const positionDebounceMap = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const selectedWaypoint = waypoints.find(w => w.id === selectedWaypointId) ?? null;
  const activeTour = tours.find(t => t.id === activeTourId) ?? null;
  const activeTourLength = activeTour?.stops.length ?? 0;
  const currentNarrative = activeTour?.stops[activeTourStep]?.narrative?.trim() ?? '';

  // T015: Startup fetch — load all persisted data on mount.
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/data');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as BulkDataResponse;
        setWaypoints(data.waypoints);
        setEdges(data.edges);
        setTours(data.tours);
        setLoadState('ready');
      } catch {
        setLoadState('error');
      }
    })();
  }, []);

  const clearErrorAfterDelay = useCallback(() => {
    setTimeout(() => setErrorMessage(null), 5000);
  }, []);

  const selectWaypoint = useCallback((id: string | null) => {
    setSelectedWaypointId(id);
  }, []);

  // T018
  const createWaypoint = useCallback(
    (data: Omit<Waypoint, 'id' | 'position'>) => {
      const id = `w-${Date.now()}`;
      const position = { x: 200 + Math.random() * 400, y: 200 + Math.random() * 300 };
      const newWaypoint: Waypoint = { id, position, ...data };
      setWaypoints(prev => [...prev, newWaypoint]);
      void (async () => {
        try {
          await apiFetch('/api/waypoints', {
            method: 'POST',
            headers: JSON_HEADERS,
            body: JSON.stringify(newWaypoint),
          });
        } catch {
          setWaypoints(prev => prev.filter(w => w.id !== id));
          setErrorMessage('Failed to save waypoint.');
          clearErrorAfterDelay();
        }
      })();
    },
    [clearErrorAfterDelay],
  );

  // T019
  const updateWaypoint = useCallback(
    (id: string, data: Partial<Omit<Waypoint, 'id'>>) => {
      const original = waypoints.find(w => w.id === id);
      if (!original) return;
      setWaypoints(prev => prev.map(w => (w.id === id ? { ...w, ...data } : w)));
      void (async () => {
        try {
          await apiFetch(`/api/waypoints/${id}`, {
            method: 'PUT',
            headers: JSON_HEADERS,
            body: JSON.stringify(data),
          });
        } catch {
          setWaypoints(prev => prev.map(w => (w.id === id ? original : w)));
          setErrorMessage('Failed to update waypoint.');
          clearErrorAfterDelay();
        }
      })();
    },
    [waypoints, clearErrorAfterDelay],
  );

  // T021 — cascade: waypoint + its edges + tour membership
  const deleteWaypoint = useCallback(
    (id: string) => {
      const waypointSnapshot = waypoints;
      const edgeSnapshot = edges;
      const tourSnapshot = tours;
      const removedEdges = edges.filter(e => e.source === id || e.target === id);
      const modifiedTours = tours
        .filter(t => t.stops.some(s => s.waypointId === id))
        .map(t => ({ ...t, stops: t.stops.filter(s => s.waypointId !== id) }));

      setWaypoints(prev => prev.filter(w => w.id !== id));
      setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
      setTours(prev =>
        prev.map(t =>
          t.stops.some(s => s.waypointId === id)
            ? { ...t, stops: t.stops.filter(s => s.waypointId !== id) }
            : t,
        ),
      );
      setSelectedWaypointId(prev => (prev === id ? null : prev));

      void (async () => {
        try {
          await apiFetch(`/api/waypoints/${id}`, { method: 'DELETE' });
          await Promise.all(removedEdges.map(e => apiFetch(`/api/edges/${e.id}`, { method: 'DELETE' })));
          await Promise.all(
            modifiedTours.map(t =>
              apiFetch(`/api/tours/${t.id}`, {
                method: 'PUT',
                headers: JSON_HEADERS,
                body: JSON.stringify({ stops: t.stops }),
              }),
            ),
          );
        } catch {
          setWaypoints(waypointSnapshot);
          setEdges(edgeSnapshot);
          setTours(tourSnapshot);
          setErrorMessage('Failed to delete waypoint.');
          clearErrorAfterDelay();
        }
      })();
    },
    [waypoints, edges, tours, clearErrorAfterDelay],
  );

  // T022
  const addEdge = useCallback(
    (connection: { source: string; target: string; label?: string }) => {
      if (connection.source === connection.target) return;
      const id = `e-${Date.now()}`;
      const newEdge: WaypointEdge = { id, ...connection };
      setEdges(prev => [...prev, newEdge]);
      void (async () => {
        try {
          await apiFetch('/api/edges', {
            method: 'POST',
            headers: JSON_HEADERS,
            body: JSON.stringify(newEdge),
          });
        } catch {
          setEdges(prev => prev.filter(e => e.id !== id));
          setErrorMessage('Failed to save connection.');
          clearErrorAfterDelay();
        }
      })();
    },
    [clearErrorAfterDelay],
  );

  // T023
  const deleteEdge = useCallback(
    (id: string) => {
      const snapshot = edges.find(e => e.id === id);
      setEdges(prev => prev.filter(e => e.id !== id));
      void (async () => {
        try {
          await apiFetch(`/api/edges/${id}`, { method: 'DELETE' });
        } catch {
          if (snapshot) setEdges(prev => [...prev, snapshot]);
          setErrorMessage('Failed to delete connection.');
          clearErrorAfterDelay();
        }
      })();
    },
    [edges, clearErrorAfterDelay],
  );

  // T024
  const createTour = useCallback(
    (data: Omit<Tour, 'id'>) => {
      const id = `t-${Date.now()}`;
      const newTour: Tour = { id, ...data };
      setTours(prev => [...prev, newTour]);
      void (async () => {
        try {
          await apiFetch('/api/tours', {
            method: 'POST',
            headers: JSON_HEADERS,
            body: JSON.stringify(newTour),
          });
        } catch {
          setTours(prev => prev.filter(t => t.id !== id));
          setErrorMessage('Failed to save tour.');
          clearErrorAfterDelay();
        }
      })();
    },
    [clearErrorAfterDelay],
  );

  const deleteTour = useCallback(
    (id: string) => {
      const snapshot = tours;
      setTours(prev => prev.filter(t => t.id !== id));
      if (activeTourId === id) {
        setActiveTourId(null);
        setActiveTourStepRaw(0);
      }
      void (async () => {
        try {
          await apiFetch(`/api/tours/${id}`, { method: 'DELETE' });
        } catch {
          setTours(snapshot);
          setErrorMessage('Failed to delete tour.');
          clearErrorAfterDelay();
        }
      })();
    },
    [tours, activeTourId, clearErrorAfterDelay],
  );

  // T025
  const updateTour = useCallback(
    (id: string, data: Partial<Omit<Tour, 'id'>>) => {
      const original = tours.find(t => t.id === id);
      if (!original) return;
      setTours(prev => prev.map(t => (t.id === id ? { ...t, ...data } : t)));
      void (async () => {
        try {
          await apiFetch(`/api/tours/${id}`, {
            method: 'PUT',
            headers: JSON_HEADERS,
            body: JSON.stringify(data),
          });
        } catch {
          setTours(prev => prev.map(t => (t.id === id ? original : t)));
          setErrorMessage('Failed to update tour.');
          clearErrorAfterDelay();
        }
      })();
    },
    [tours, clearErrorAfterDelay],
  );

  const onToggleMarkdownView = useCallback(() => setMarkdownViewOpen(v => !v), []);

  const selectTour = useCallback(
    (id: string | null) => {
      setActiveTourId(id);
      setActiveTourStepRaw(0);
      setMarkdownViewOpen(!!id);
      if (id) {
        const tour = tours.find(t => t.id === id);
        setSelectedWaypointId(tour?.stops[0]?.waypointId ?? null);
      }
    },
    [tours],
  );

  // Escape exits the active tour, unless a modal is open (which takes
  // priority and handles its own Escape) or focus is in a text input.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (!activeTourId) return;
      if (tourEditorOpen || form.open) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      selectTour(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activeTourId, tourEditorOpen, form.open, selectTour]);

  const onNext = useCallback(() => {
    if (!activeTour) return;
    const next = activeTourStep + 1;
    if (next >= activeTour.stops.length) {
      setActiveTourId(null);
      return;
    }
    setActiveTourStepRaw(next);
    setSelectedWaypointId(activeTour.stops[next].waypointId);
  }, [activeTour, activeTourStep]);

  const onPrev = useCallback(() => {
    if (!activeTour || activeTourStep === 0) return;
    const prev = activeTourStep - 1;
    setActiveTourStepRaw(prev);
    setSelectedWaypointId(activeTour.stops[prev].waypointId);
  }, [activeTour, activeTourStep]);

  // T020 — debounced per node ID: onNodesChange fires on every drag frame.
  const onNodePositionChange = useCallback(
    (id: string, position: { x: number; y: number }) => {
      setWaypoints(prev => prev.map(w => (w.id === id ? { ...w, position } : w)));
      const existing = positionDebounceMap.current.get(id);
      if (existing) clearTimeout(existing);
      positionDebounceMap.current.set(
        id,
        setTimeout(() => {
          positionDebounceMap.current.delete(id);
          void fetch(`/api/waypoints/${id}`, {
            method: 'PUT',
            headers: JSON_HEADERS,
            body: JSON.stringify({ position }),
          }).catch(() => {
            setErrorMessage('Failed to save position.');
            clearErrorAfterDelay();
          });
        }, 500),
      );
    },
    [clearErrorAfterDelay],
  );

  const openCreateForm = useCallback(() => setForm({ open: true, mode: 'create' }), []);
  const openEditForm = useCallback(
    (waypoint: Waypoint) => setForm({ open: true, mode: 'edit', waypoint }),
    [],
  );
  const closeForm = useCallback(() => setForm({ open: false }), []);

  const handleFormSave = useCallback(
    (data: Omit<Waypoint, 'id' | 'position'>) => {
      if (form.open && form.mode === 'create') {
        createWaypoint(data);
      } else if (form.open && form.mode === 'edit') {
        updateWaypoint(form.waypoint.id, data);
      }
      closeForm();
    },
    [form, createWaypoint, updateWaypoint, closeForm],
  );

  // T016: Loading and error states
  if (loadState === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading…
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        Could not load data. Please refresh.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="px-4 py-4 border-b border-gray-200 bg-black shrink-0 text-center">
        <h1 className="text-4xl font-bold text-white">Cognitive Tours</h1>
        <p className="text-lg font-bold text-gray-200 mt-1">"HandCrafted" Scaffolding for Building and Sharing Understanding</p>
      </div>
      {/* T017: Error banner for mutation failures */}
      {errorMessage !== null && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-2 text-sm">
          {errorMessage}
        </div>
      )}
      <TourBar
        tours={tours}
        activeTourId={activeTourId}
        activeTourStep={activeTourStep}
        activeTourLength={activeTourLength}
        onSelectTour={selectTour}
        onNext={onNext}
        onPrev={onPrev}
        onCreateTour={createTour}
        onUpdateTour={updateTour}
        onDeleteTour={deleteTour}
        waypoints={waypoints}
        markdownViewOpen={markdownViewOpen}
        onToggleMarkdownView={onToggleMarkdownView}
        onEditorOpenChange={setTourEditorOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative overflow-hidden">
          {markdownViewOpen && activeTour ? (
            <TourMarkdownView tour={activeTour} waypoints={waypoints} activeStepIndex={activeTourStep} />
          ) : (
            <WaypointGraph
              waypoints={waypoints}
              edges={edges}
              selectedWaypointId={selectedWaypointId}
              activeTourWaypointIds={activeTour?.stops.map(s => s.waypointId) ?? []}
              onSelectWaypoint={selectWaypoint}
              onConnect={addEdge}
              onDeleteEdge={deleteEdge}
              onDeleteWaypoint={deleteWaypoint}
              onNodePositionChange={onNodePositionChange}
              onAddWaypointClick={openCreateForm}
              filterState={filterState}
              onFilterChange={(type, visible) => setFilterState(prev => ({ ...prev, [type]: visible }))}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              tourName={activeTour?.name}
              tourDescription={activeTour?.description}
              narrative={currentNarrative}
            />
          )}
        </div>
        {!markdownViewOpen && (
          <div className="w-80 border-l border-gray-200 overflow-y-auto bg-white">
            <WaypointDetail
              waypoint={selectedWaypoint}
              onEdit={openEditForm}
              onDelete={deleteWaypoint}
              hasActiveTour={!!activeTour}
              tours={tours}
            />
          </div>
        )}
      </div>
      {form.open && (
        <WaypointForm
          mode={form.mode}
          initialValues={form.mode === 'edit' ? form.waypoint : undefined}
          onSave={handleFormSave}
          onCancel={closeForm}
        />
      )}
    </div>
  );
}
