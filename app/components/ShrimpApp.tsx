'use client';

import { useState, useCallback } from 'react';
import type { Waypoint, WaypointEdge, Tour } from '@/app/lib/types';
import { INITIAL_WAYPOINTS, INITIAL_EDGES, INITIAL_TOURS } from '@/app/lib/mock-data';
import WaypointGraph from './WaypointGraph';
import WaypointDetail from './WaypointDetail';
import TourBar from './TourBar';
import WaypointForm from './WaypointForm';

type FormState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; waypoint: Waypoint };

export default function ShrimpApp() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>(INITIAL_WAYPOINTS);
  const [edges, setEdges] = useState<WaypointEdge[]>(INITIAL_EDGES);
  const [tours, setTours] = useState<Tour[]>(INITIAL_TOURS);
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(null);
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const [activeTourStep, setActiveTourStepRaw] = useState<number>(0);
  const [form, setForm] = useState<FormState>({ open: false });

  const selectedWaypoint = waypoints.find(w => w.id === selectedWaypointId) ?? null;
  const activeTour = tours.find(t => t.id === activeTourId) ?? null;
  const activeTourLength = activeTour?.waypointIds.length ?? 0;

  const selectWaypoint = useCallback((id: string | null) => {
    setSelectedWaypointId(id);
  }, []);

  const createWaypoint = useCallback((data: Omit<Waypoint, 'id' | 'position'>) => {
    const id = `w-${Date.now()}`;
    const position = { x: 200 + Math.random() * 400, y: 200 + Math.random() * 300 };
    setWaypoints(prev => [...prev, { id, position, ...data }]);
  }, []);

  const updateWaypoint = useCallback((id: string, data: Partial<Omit<Waypoint, 'id'>>) => {
    setWaypoints(prev => prev.map(w => w.id === id ? { ...w, ...data } : w));
  }, []);

  const deleteWaypoint = useCallback((id: string) => {
    setWaypoints(prev => prev.filter(w => w.id !== id));
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
    setTours(prev => prev.map(t => ({ ...t, waypointIds: t.waypointIds.filter(wid => wid !== id) })));
    setSelectedWaypointId(prev => prev === id ? null : prev);
  }, []);

  const addEdge = useCallback((connection: { source: string; target: string }) => {
    if (connection.source === connection.target) return;
    const id = `e-${Date.now()}`;
    setEdges(prev => [...prev, { id, ...connection }]);
  }, []);

  const deleteEdge = useCallback((id: string) => {
    setEdges(prev => prev.filter(e => e.id !== id));
  }, []);

  const createTour = useCallback((data: Omit<Tour, 'id'>) => {
    const id = `t-${Date.now()}`;
    setTours(prev => [...prev, { id, ...data }]);
  }, []);

  const updateTour = useCallback((id: string, data: Partial<Omit<Tour, 'id'>>) => {
    setTours(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  const selectTour = useCallback((id: string | null) => {
    setActiveTourId(id);
    setActiveTourStepRaw(0);
    if (id) {
      const tour = tours.find(t => t.id === id);
      setSelectedWaypointId(tour?.waypointIds[0] ?? null);
    }
  }, [tours]);

  const onNext = useCallback(() => {
    if (!activeTour) return;
    const next = activeTourStep + 1;
    if (next >= activeTour.waypointIds.length) {
      setActiveTourId(null);
      return;
    }
    setActiveTourStepRaw(next);
    setSelectedWaypointId(activeTour.waypointIds[next]);
  }, [activeTour, activeTourStep]);

  const onPrev = useCallback(() => {
    if (!activeTour || activeTourStep === 0) return;
    const prev = activeTourStep - 1;
    setActiveTourStepRaw(prev);
    setSelectedWaypointId(activeTour.waypointIds[prev]);
  }, [activeTour, activeTourStep]);

  const onNodePositionChange = useCallback((id: string, position: { x: number; y: number }) => {
    setWaypoints(prev => prev.map(w => w.id === id ? { ...w, position } : w));
  }, []);

  const openCreateForm = useCallback(() => setForm({ open: true, mode: 'create' }), []);
  const openEditForm = useCallback((waypoint: Waypoint) => setForm({ open: true, mode: 'edit', waypoint }), []);
  const closeForm = useCallback(() => setForm({ open: false }), []);

  const handleFormSave = useCallback((data: Omit<Waypoint, 'id' | 'position'>) => {
    if (form.open && form.mode === 'create') {
      createWaypoint(data);
    } else if (form.open && form.mode === 'edit') {
      updateWaypoint(form.waypoint.id, data);
    }
    closeForm();
  }, [form, createWaypoint, updateWaypoint, closeForm]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
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
        waypoints={waypoints}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <WaypointGraph
            waypoints={waypoints}
            edges={edges}
            selectedWaypointId={selectedWaypointId}
            onSelectWaypoint={selectWaypoint}
            onConnect={addEdge}
            onDeleteEdge={deleteEdge}
            onDeleteWaypoint={deleteWaypoint}
            onNodePositionChange={onNodePositionChange}
            onAddWaypointClick={openCreateForm}
          />
        </div>
        <div className="w-80 border-l border-gray-200 overflow-y-auto bg-white">
          <WaypointDetail
            waypoint={selectedWaypoint}
            onEdit={openEditForm}
            onDelete={deleteWaypoint}
          />
        </div>
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
