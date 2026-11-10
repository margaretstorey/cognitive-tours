'use client';

import { useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { Waypoint, WaypointEdge, Tour, TourStop, FilterState } from '@/app/lib/types';
import { WAYPOINT_TYPES } from '@/app/lib/types';
import { WAYPOINT_COLORS } from '@/app/lib/waypoint-colors';
import WaypointGraph from './WaypointGraph';
import WaypointDetail from './WaypointDetail';
import TourBar from './TourBar';
import TourMarkdownView from './TourMarkdownView';
import WaypointForm from './WaypointForm';
import { PROJECT_NAME, SITE_COLOR, SITE_NOTICE, START_HERE_TOUR, pickStartHereTourId } from '@/app/lib/project';
import { ClaudeCodeSkillsButton } from '@/app/components/ClaudeCodePanel';
import { StartHere } from '@/app/components/StartHere';
import { EDIT_PASSCODE_HEADER } from '@/app/lib/edit-passcode';
import { useCodeFolder, vscodeLink } from '@/app/lib/code-folder';
import { githubFileLink, linkLabel, useRepoUrl } from '@/app/lib/repo';
import { stopKey, useSeen } from '@/app/lib/seen';

type FormState =
  | { open: false }
  | { open: true; mode: 'create'; position: { x: number; y: number } | null }
  | { open: true; mode: 'edit'; waypoint: Waypoint };

type LoadState = 'loading' | 'ready' | 'error';

// Undo for deletes (this page view only; a reload empties the stack). Each
// entry holds what its delete removed. `saved` settles once the delete has
// reached the server (true if it succeeded), so an undo never races the
// delete it reverses.
type UndoEntry =
  | {
      kind: 'waypoint';
      key: number;
      waypoint: Waypoint;
      edges: WaypointEdge[];
      // The stop's old position in each tour it was in, with its narrative.
      stops: { tourId: string; tourName: string; index: number; stop: TourStop }[];
      saved: Promise<boolean>;
    }
  | { kind: 'edge'; key: number; edge: WaypointEdge; from: string; to: string; saved: Promise<boolean> };

const UNDO_LIMIT = 20;
const UNDO_TOAST_MS = 10_000;

function undoMessage(entry: UndoEntry): string {
  return entry.kind === 'waypoint'
    ? `Deleted ${entry.waypoint.label}.`
    : `Deleted link ${entry.from} → ${entry.to}.`;
}

// Ctrl/⌘-Z belongs to text undo while you're typing.
function isTyping(): boolean {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement)) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
}

interface BulkDataResponse {
  waypoints: Waypoint[];
  edges: WaypointEdge[];
  tours: Tour[];
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// A new id for a waypoint, edge or tour, made in the browser. The timestamp
// alone could repeat when two saves land in the same millisecond (two people
// on one site, or parallel test runs), and the server then refuses the
// second; the random ending makes that practically impossible.
function newId(prefix: 'w' | 'e' | 't'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_FILTER_STATE: FilterState = Object.fromEntries(
  WAYPOINT_TYPES.map(t => [t, true])
) as FilterState;

// Edit passcode (app/lib/edit-passcode.ts): on a site that has one, writes
// carry it; this browser asks once and remembers it. Sites without one never ask.
const PASSCODE_KEY = 'cognitive-tours-edit-passcode';

function savedPasscode(): string | null {
  try {
    return localStorage.getItem(PASSCODE_KEY);
  } catch {
    return null;
  }
}

// Several writes refused at once (e.g. deleting a waypoint's edges) share one prompt.
let passcodePrompt: Promise<string | null> | null = null;

function askForPasscode(again: boolean): Promise<string | null> {
  passcodePrompt ??= Promise.resolve().then(() => {
    const entered = window.prompt(
      again
        ? "That passcode didn't work. Enter this map's edit passcode:"
        : 'This map needs a passcode to edit. Enter it once; this browser will remember it.',
    );
    passcodePrompt = null;
    const passcode = entered?.trim() || null;
    if (passcode) {
      try {
        localStorage.setItem(PASSCODE_KEY, passcode);
      } catch {
        // Storage blocked: the passcode works for this edit only.
      }
    }
    return passcode;
  });
  return passcodePrompt;
}

// Saves still on their way to the server; the map doesn't refresh itself
// while any are, so an older copy can't overwrite an optimistic change.
let pendingWrites = 0;

async function apiFetch(url: string, options: RequestInit): Promise<void> {
  pendingWrites++;
  try {
    let passcode = savedPasscode();
    for (let attempt = 0; attempt < 3; attempt++) {
      const headers = new Headers(options.headers);
      if (passcode) headers.set(EDIT_PASSCODE_HEADER, passcode);
      const res = await fetch(url, { ...options, headers });
      if (res.status !== 401) {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return;
      }
      passcode = await askForPasscode(passcode !== null);
      if (!passcode) throw new Error('Edit cancelled: this map needs a passcode');
    }
    throw new Error('HTTP 401');
  } finally {
    pendingWrites--;
  }
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
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [controlPanelCollapsed, setControlPanelCollapsed] = useState(false);
  // During a tour the graph follows the current stop; overview fits every stop.
  const [tourOverview, setTourOverview] = useState(false);
  const [codeFolder] = useCodeFolder();
  const { repoUrl } = useRepoUrl();
  const [tourSuspended, setTourSuspended] = useState(false);
  const [stopTextExpanded, setStopTextExpanded] = useState(false);
  const [stopDescriptionOverflowing, setStopDescriptionOverflowing] = useState(false);
  const [stopNotesOverflowing, setStopNotesOverflowing] = useState(false);
  const [stopLinkCopied, setStopLinkCopied] = useState(false);
  const stopDescriptionRef = useRef<HTMLParagraphElement>(null);
  const stopNotesRef = useRef<HTMLParagraphElement>(null);
  // Per-node debounce map for position changes (onNodesChange fires on every drag frame).
  const positionDebounceMap = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Set by WaypointGraph while the map is shown: where a new waypoint should go.
  const placementRef = useRef<(() => { x: number; y: number } | null) | null>(null);

  // Red "new" halo on what this browser hasn't seen yet (app/lib/seen.ts).
  const { newAtLoad, arrivedAfterLoad, isNewWaypoint, isNewStop, markWaypointsSeen, markStopsSeen } =
    useSeen(waypoints, tours, loadState === 'ready');
  // Waypoints the graph should make room for (app/lib/make-room.ts): ones you
  // create, once per page load the new ones a skill or teammate added, and
  // those that turn up when the map refreshes on your return to the tab.
  const [createdNeedingRoom, setCreatedNeedingRoom] = useState<string[]>([]);
  const [roomMadeOnLoad, setRoomMadeOnLoad] = useState(false);
  const [arrivedRoomed, setArrivedRoomed] = useState(0);
  const makeRoomFor = useMemo(
    () => [
      ...(roomMadeOnLoad ? [] : newAtLoad),
      ...arrivedAfterLoad.slice(arrivedRoomed),
      ...createdNeedingRoom,
    ],
    [roomMadeOnLoad, newAtLoad, arrivedAfterLoad, arrivedRoomed, createdNeedingRoom],
  );
  // What you just created glows, like a skill's new waypoint, until you click
  // into its Description field or it has a description (this page view only),
  // and the map zooms to it. On load, the map zooms to fit the new waypoints a
  // skill or teammate added (they glow via the seen list).
  const [justCreated, setJustCreated] = useState<string[]>([]);
  const [createdFocus, setCreatedFocus] = useState<{ ids: string[]; key: number } | null>(null);
  const focusRequest = useMemo(
    () => createdFocus ?? (newAtLoad.length > 0 ? { ids: newAtLoad, key: 0 } : null),
    [createdFocus, newAtLoad],
  );
  const clearJustCreated = useCallback((id: string | null) => {
    if (id) setJustCreated(prev => (prev.includes(id) ? prev.filter(x => x !== id) : prev));
  }, []);
  const onRoomMade = useCallback(() => {
    setCreatedNeedingRoom([]);
    if (newAtLoad.length > 0) setRoomMadeOnLoad(true);
    setArrivedRoomed(arrivedAfterLoad.length);
  }, [newAtLoad, arrivedAfterLoad]);
  // Selecting a waypoint doesn't count as seeing it: its red halo stays until
  // you click into its Description field (WaypointForm) or it has one. The
  // same goes for the glow on one you just created.
  const glowingCreated = useMemo(
    () => justCreated.filter(id => !waypoints.find(w => w.id === id)?.description?.trim()),
    [justCreated, waypoints],
  );

  // Filter panel's "New to you only": show just the waypoints with a red halo
  // (new to this browser, or just created). It unticks itself once none are
  // left, so you're never left looking at an empty map.
  const newWaypointIds = useMemo(
    () => new Set(waypoints.filter(w => isNewWaypoint(w) || glowingCreated.includes(w.id)).map(w => w.id)),
    [waypoints, isNewWaypoint, glowingCreated],
  );
  const [newOnly, setNewOnly] = useState(false);
  if (newOnly && newWaypointIds.size === 0) setNewOnly(false);

  const selectedWaypoint = waypoints.find(w => w.id === selectedWaypointId) ?? null;
  const activeTour = tours.find(t => t.id === activeTourId) ?? null;
  const activeTourLength = activeTour?.stops.length ?? 0;
  const currentStopWaypointId = activeTour?.stops[activeTourStep]?.waypointId ?? null;
  const currentStopWaypoint = waypoints.find(w => w.id === currentStopWaypointId) ?? null;
  const currentNarrative = activeTour?.stops[activeTourStep]?.narrative?.trim() ?? '';
  const showingMarkdown = markdownViewOpen && !!activeTour;

  // Markdown view opens at the selected waypoint's stop when it's in this tour
  // (e.g. another stop clicked while suspended), otherwise at the current stop.
  const selectedStopIndex = activeTour?.stops.findIndex(s => s.waypointId === selectedWaypointId) ?? -1;
  const markdownJumpIndex = selectedStopIndex >= 0 ? selectedStopIndex : activeTourStep;

  useEffect(() => {
    if (!showingMarkdown) return;
    document.getElementById(`stop-${markdownJumpIndex}`)?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, [showingMarkdown, markdownJumpIndex]);

  // The map as last loaded from the server (its JSON), so a refresh that
  // finds nothing new changes nothing.
  const lastLoadedRef = useRef('');

  // T015: Startup fetch — load all persisted data on mount.
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/data');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const data = JSON.parse(text) as BulkDataResponse;
        lastLoadedRef.current = text;
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

  // Undo for deletes: a stack of the last UNDO_LIMIT deletes (a ref, so two
  // quick Ctrl/⌘-Z presses never undo the same one twice), and a toast for
  // the most recent, shown for 10 seconds or until the next delete.
  const undoStackRef = useRef<UndoEntry[]>([]);
  const undoKeyRef = useRef(0);
  const [undoToast, setUndoToast] = useState<UndoEntry | null>(null);

  // Refresh on return (Nov 11): when you come back to the tab (say, after
  // running a suggest skill in the terminal), reload the map quietly, so what
  // a skill or teammate added appears with its red halo. At most every 5 s;
  // never while a form, the tour editor or a dialog is open, a save is on its
  // way, or a waypoint is being dragged (it tries again on the next return).
  // Selection, the active tour, the camera and filters stay as they are.
  const busyRef = useRef(false);
  busyRef.current = form.open || tourEditorOpen || loadState !== 'ready';
  useEffect(() => {
    let lastTry = 0;
    const blocked = () =>
      busyRef.current ||
      pendingWrites > 0 ||
      positionDebounceMap.current.size > 0 ||
      !!document.querySelector('[role="dialog"], .react-flow__node.dragging');
    const refresh = async () => {
      if (document.visibilityState !== 'visible' || blocked()) return;
      if (Date.now() - lastTry < 5000) return;
      lastTry = Date.now();
      try {
        const res = await fetch('/api/data', { cache: 'no-store' });
        if (!res.ok) return;
        const text = await res.text();
        if (text === lastLoadedRef.current || blocked()) return;
        const data = JSON.parse(text) as BulkDataResponse;
        lastLoadedRef.current = text;
        setWaypoints(data.waypoints);
        setEdges(data.edges);
        setTours(data.tours);
        const waypointIds = new Set(data.waypoints.map(w => w.id));
        const edgeIds = new Set(data.edges.map(e => e.id));
        setSelectedWaypointId(prev => (prev && !waypointIds.has(prev) ? null : prev));
        setActiveTourId(prev => (prev && !data.tours.some(t => t.id === prev) ? null : prev));
        // A delete someone undid or redid elsewhere: don't let undo duplicate it.
        undoStackRef.current = undoStackRef.current.filter(e =>
          e.kind === 'waypoint' ? !waypointIds.has(e.waypoint.id) : !edgeIds.has(e.edge.id),
        );
      } catch {
        // Offline or a hiccup: keep what's shown; the next return tries again.
      }
    };
    const onReturn = () => void refresh();
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', onReturn);
    return () => {
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('focus', onReturn);
    };
  }, []);

  useEffect(() => {
    if (!undoToast) return;
    const timer = setTimeout(() => setUndoToast(null), UNDO_TOAST_MS);
    return () => clearTimeout(timer);
  }, [undoToast]);

  const pushUndo = useCallback((entry: UndoEntry) => {
    undoStackRef.current = [...undoStackRef.current, entry].slice(-UNDO_LIMIT);
    setUndoToast(entry);
  }, []);

  // A delete that failed was already rolled back, so there's nothing to undo.
  const dropUndo = useCallback((key: number) => {
    undoStackRef.current = undoStackRef.current.filter(e => e.key !== key);
    setUndoToast(t => (t?.key === key ? null : t));
  }, []);

  // Description/notes expansion in the Tour Controls panel always starts
  // collapsed again when the tour advances to a new stop.
  useEffect(() => {
    setStopTextExpanded(false);
  }, [currentStopWaypointId]);

  // Notes are only shown alongside a collapsed description if the
  // description isn't already using up its full line-clamp allowance.
  useLayoutEffect(() => {
    if (stopTextExpanded) return;
    const el = stopDescriptionRef.current;
    setStopDescriptionOverflowing(!!el && el.scrollHeight > el.clientHeight + 1);
  }, [currentStopWaypoint?.description, stopTextExpanded]);

  // Measured independently from description so the "More" toggle only
  // appears when a field's own rendered text is actually being clamped.
  useLayoutEffect(() => {
    if (stopTextExpanded) return;
    const el = stopNotesRef.current;
    setStopNotesOverflowing(!!el && el.scrollHeight > el.clientHeight + 1);
  }, [currentStopWaypoint?.notes, stopTextExpanded, stopDescriptionOverflowing]);

  const selectWaypoint = useCallback(
    (id: string | null) => {
      setSelectedWaypointId(id);
      // Clicking an off-tour node suspends the tour rather than ending it:
      // Tour Controls collapses (its existing collapse affordance) and the
      // Waypoint panel opens to show the clicked node.
      if (activeTour && id !== null && id !== currentStopWaypointId) {
        setTourSuspended(true);
        setControlPanelCollapsed(true);
        setPanelCollapsed(false);
      }
    },
    [activeTour, currentStopWaypointId],
  );

  const resumeTour = useCallback(() => {
    setTourSuspended(false);
    setControlPanelCollapsed(false);
    setPanelCollapsed(true);
    setTourOverview(false);
    setSelectedWaypointId(currentStopWaypointId);
  }, [currentStopWaypointId]);

  // T018
  const createWaypoint = useCallback(
    (data: Omit<Waypoint, 'id' | 'position'>, placement: { x: number; y: number } | null) => {
      const id = newId('w');
      // Normally where the cursor last was on the map (see WaypointGraph's
      // placementRef). When the map isn't showing (markdown view, or the
      // empty-map screen), fall back to the top-right corner of the map.
      const maxX = waypoints.length > 0 ? Math.max(...waypoints.map(w => w.position.x)) : 400;
      const minY = waypoints.length > 0 ? Math.min(...waypoints.map(w => w.position.y)) : 100;
      const position = placement ?? { x: maxX + 150, y: minY };
      const newWaypoint: Waypoint = { id, position, ...data };
      markWaypointsSeen([id]); // your own waypoint is never "new" to you
      setWaypoints(prev => [...prev, newWaypoint]);
      setCreatedNeedingRoom(prev => [...prev, id]);
      setJustCreated(prev => [...prev, id]);
      setCreatedFocus({ ids: [id], key: Date.now() });
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
    [waypoints, clearErrorAfterDelay, markWaypointsSeen],
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
      const deleted = waypoints.find(w => w.id === id);
      const undoKey = ++undoKeyRef.current;

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

      const saved = (async () => {
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
          return true;
        } catch {
          setWaypoints(waypointSnapshot);
          setEdges(edgeSnapshot);
          setTours(tourSnapshot);
          dropUndo(undoKey);
          setErrorMessage('Failed to delete waypoint.');
          clearErrorAfterDelay();
          return false;
        }
      })();

      if (deleted) {
        pushUndo({
          kind: 'waypoint',
          key: undoKey,
          waypoint: deleted,
          edges: removedEdges,
          stops: tours.flatMap(t => {
            const index = t.stops.findIndex(s => s.waypointId === id);
            return index < 0 ? [] : [{ tourId: t.id, tourName: t.name, index, stop: t.stops[index] }];
          }),
          saved,
        });
      }
    },
    [waypoints, edges, tours, clearErrorAfterDelay, pushUndo, dropUndo],
  );

  // T022
  const addEdge = useCallback(
    (connection: { source: string; target: string; label?: string }) => {
      if (connection.source === connection.target) return;
      const id = newId('e');
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
      const undoKey = ++undoKeyRef.current;
      setEdges(prev => prev.filter(e => e.id !== id));
      const saved = (async () => {
        try {
          await apiFetch(`/api/edges/${id}`, { method: 'DELETE' });
          return true;
        } catch {
          if (snapshot) setEdges(prev => [...prev, snapshot]);
          dropUndo(undoKey);
          setErrorMessage('Failed to delete connection.');
          clearErrorAfterDelay();
          return false;
        }
      })();
      if (snapshot) {
        const labelOf = (wid: string) => waypoints.find(w => w.id === wid)?.label ?? wid;
        pushUndo({
          kind: 'edge',
          key: undoKey,
          edge: snapshot,
          from: labelOf(snapshot.source),
          to: labelOf(snapshot.target),
          saved,
        });
      }
    },
    [edges, waypoints, clearErrorAfterDelay, pushUndo, dropUndo],
  );

  // Put back what a waypoint delete removed: the waypoint (same id), its
  // links, and its stop in each tour, at its old position in the tour's
  // current stop list, so stops added or moved since are kept. Restores
  // what it can and says what it couldn't (e.g. a tour deleted meanwhile).
  const restoreWaypoint = useCallback(
    (entry: Extract<UndoEntry, { kind: 'waypoint' }>) => {
      const { waypoint } = entry;
      if (waypoints.some(w => w.id === waypoint.id)) return;
      const problems: string[] = [];

      const linksBack = entry.edges.filter(e => {
        const other = e.source === waypoint.id ? e.target : e.source;
        return other === waypoint.id || waypoints.some(w => w.id === other);
      });
      const linksGone = entry.edges.length - linksBack.length;
      if (linksGone > 0) problems.push(`${linksGone} link${linksGone === 1 ? '' : 's'} to waypoints that are gone`);

      const tourStops = entry.stops.flatMap(({ tourId, tourName, index, stop }) => {
        const tour = tours.find(t => t.id === tourId);
        if (!tour) {
          problems.push(`its stop in "${tourName}" (that tour is gone)`);
          return [];
        }
        if (tour.stops.some(s => s.waypointId === waypoint.id)) return [];
        const stops = [...tour.stops];
        stops.splice(Math.min(index, stops.length), 0, stop);
        return [{ tourId, tourName, stops }];
      });

      const removeStopFrom = (tourIds: string[]) =>
        setTours(prev =>
          prev.map(t =>
            tourIds.includes(t.id) ? { ...t, stops: t.stops.filter(s => s.waypointId !== waypoint.id) } : t,
          ),
        );

      markWaypointsSeen([waypoint.id]); // not new to you: you made it, or saw it before
      markStopsSeen(tourStops.map(ts => stopKey(ts.tourId, waypoint.id)));
      setWaypoints(prev => [...prev, waypoint]);
      setEdges(prev => [...prev, ...linksBack]);
      setTours(prev =>
        prev.map(t => {
          const back = tourStops.find(ts => ts.tourId === t.id);
          return back ? { ...t, stops: back.stops } : t;
        }),
      );

      void (async () => {
        // A failed delete was rolled back already and left nothing to undo.
        if (!(await entry.saved)) return;
        try {
          await apiFetch('/api/waypoints', {
            method: 'POST',
            headers: JSON_HEADERS,
            body: JSON.stringify(waypoint),
          });
        } catch {
          setWaypoints(prev => prev.filter(w => w.id !== waypoint.id));
          setEdges(prev => prev.filter(e => !linksBack.some(l => l.id === e.id)));
          removeStopFrom(tourStops.map(ts => ts.tourId));
          setErrorMessage(`Couldn't undo: ${waypoint.label} wasn't restored.`);
          clearErrorAfterDelay();
          return;
        }

        const linkResults = await Promise.allSettled(
          linksBack.map(e =>
            apiFetch('/api/edges', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(e) }),
          ),
        );
        const linksFailed = linksBack.filter((_, i) => linkResults[i].status === 'rejected');
        if (linksFailed.length > 0) {
          setEdges(prev => prev.filter(e => !linksFailed.some(l => l.id === e.id)));
          problems.push(`${linksFailed.length} link${linksFailed.length === 1 ? '' : 's'}`);
        }

        const stopResults = await Promise.allSettled(
          tourStops.map(ts =>
            apiFetch(`/api/tours/${ts.tourId}`, {
              method: 'PUT',
              headers: JSON_HEADERS,
              body: JSON.stringify({ stops: ts.stops }),
            }),
          ),
        );
        const stopsFailed = tourStops.filter((_, i) => stopResults[i].status === 'rejected');
        if (stopsFailed.length > 0) {
          removeStopFrom(stopsFailed.map(ts => ts.tourId));
          problems.push(...stopsFailed.map(ts => `its stop in "${ts.tourName}"`));
        }

        if (problems.length > 0) {
          setErrorMessage(`Restored ${waypoint.label}, but not ${problems.join(', ')}.`);
          clearErrorAfterDelay();
        }
      })();
    },
    [waypoints, tours, markWaypointsSeen, markStopsSeen, clearErrorAfterDelay],
  );

  const restoreEdge = useCallback(
    (entry: Extract<UndoEntry, { kind: 'edge' }>) => {
      const { edge } = entry;
      if (edges.some(e => e.id === edge.id)) return;
      if (!waypoints.some(w => w.id === edge.source) || !waypoints.some(w => w.id === edge.target)) {
        setErrorMessage(`Couldn't undo: the link ${entry.from} → ${entry.to} joins a waypoint that is gone.`);
        clearErrorAfterDelay();
        return;
      }
      setEdges(prev => [...prev, edge]);
      void (async () => {
        if (!(await entry.saved)) return;
        try {
          await apiFetch('/api/edges', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(edge) });
        } catch {
          setEdges(prev => prev.filter(e => e.id !== edge.id));
          setErrorMessage(`Couldn't undo: the link ${entry.from} → ${entry.to} wasn't restored.`);
          clearErrorAfterDelay();
        }
      })();
    },
    [edges, waypoints, clearErrorAfterDelay],
  );

  // Undo the most recent delete still on the stack (toast button or Ctrl/⌘-Z).
  const undoLast = useCallback(() => {
    const entry = undoStackRef.current.at(-1);
    if (!entry) return;
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    setUndoToast(null);
    if (entry.kind === 'waypoint') restoreWaypoint(entry);
    else restoreEdge(entry);
  }, [restoreWaypoint, restoreEdge]);

  // T024
  const createTour = useCallback(
    (data: Omit<Tour, 'id'>) => {
      const id = newId('t');
      const newTour: Tour = { id, ...data };
      markStopsSeen(data.stops.map(st => stopKey(id, st.waypointId)));
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
    [clearErrorAfterDelay, markStopsSeen],
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
      // Stops you add in the editor are yours, so not "new"; stops that were
      // already there keep their halo until clicked into or narrated.
      if (data.stops) {
        const before = new Set(original.stops.map(st => st.waypointId));
        markStopsSeen(data.stops.filter(st => !before.has(st.waypointId)).map(st => stopKey(id, st.waypointId)));
      }
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
    [tours, clearErrorAfterDelay, markStopsSeen],
  );

  const onToggleMarkdownView = useCallback(() => setMarkdownViewOpen(v => !v), []);

  const selectTour = useCallback(
    (id: string | null) => {
      setActiveTourId(id);
      setActiveTourStepRaw(0);
      setTourOverview(false);
      setPanelCollapsed(!!id);
      setControlPanelCollapsed(false);
      setTourSuspended(false);
      if (!id) {
        setMarkdownViewOpen(false);
        setSelectedWaypointId(null);
      }
      if (id) {
        // No point selecting a stop in markdown view — there's no Prev/Next
        // there to act on it, and markdown view doesn't read selection anyway.
        if (!markdownViewOpen) {
          const tour = tours.find(t => t.id === id);
          setSelectedWaypointId(tour?.stops[0]?.waypointId ?? null);
        }
        setFilterState(DEFAULT_FILTER_STATE);
        setNewOnly(false);
      }
    },
    [tours, markdownViewOpen],
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

  // Ctrl/⌘-Z undoes the most recent delete, except while typing or with a
  // form, the tour editor, or a dialog (skills panel, Start here) open.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'z' || !(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
      if (form.open || tourEditorOpen || isTyping() || document.querySelector('[role="dialog"]')) return;
      if (undoStackRef.current.length === 0) return;
      e.preventDefault();
      undoLast();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [form.open, tourEditorOpen, undoLast]);

  // "Start here" shows Tour Controls by starting a tour, unless one is running:
  // the site's NEXT_PUBLIC_START_HERE_TOUR if it's on the map, else the first.
  const showTourForStartHere = useCallback(() => {
    if (activeTourId) return;
    const id = pickStartHereTourId(tours, START_HERE_TOUR);
    if (id) selectTour(id);
  }, [activeTourId, tours, selectTour]);

  const onNext = useCallback(() => {
    if (!activeTour) return;
    const next = activeTourStep + 1;
    if (next >= activeTour.stops.length) {
      setActiveTourId(null);
      return;
    }
    setActiveTourStepRaw(next);
    setTourOverview(false);
    setSelectedWaypointId(activeTour.stops[next].waypointId);
  }, [activeTour, activeTourStep]);

  const onPrev = useCallback(() => {
    if (!activeTour || activeTourStep === 0) return;
    const prev = activeTourStep - 1;
    setActiveTourStepRaw(prev);
    setTourOverview(false);
    setSelectedWaypointId(activeTour.stops[prev].waypointId);
  }, [activeTour, activeTourStep]);

  const isLastTourStep = activeTourLength > 0 && activeTourStep === activeTourLength - 1;

  const scrollToStop = (index: number) => {
    document.getElementById(`stop-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // The markdown-scroll behavior only matters if this panel is ever visible
  // while markdown view is open; today the panel is hidden whenever
  // showingMarkdown is true, so these branches are currently unreachable.
  const handlePrev = () => {
    if (markdownViewOpen && activeTourStep > 0) scrollToStop(activeTourStep - 1);
    onPrev();
  };

  const handleNext = () => {
    if (markdownViewOpen && !isLastTourStep) scrollToStop(activeTourStep + 1);
    onNext();
  };

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
          apiFetch(`/api/waypoints/${id}`, {
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

  // The position is taken when the form opens, so moving the mouse while
  // filling it in doesn't change where the waypoint lands.
  const openCreateForm = useCallback(
    () => setForm({ open: true, mode: 'create', position: placementRef.current?.() ?? null }),
    [],
  );
  const openEditForm = useCallback(
    (waypoint: Waypoint) => setForm({ open: true, mode: 'edit', waypoint }),
    [],
  );
  const editWaypointById = useCallback(
    (id: string) => {
      const waypoint = waypoints.find(w => w.id === id);
      if (waypoint) openEditForm(waypoint);
    },
    [waypoints, openEditForm],
  );
  const closeForm = useCallback(() => setForm({ open: false }), []);

  const handleFormSave = useCallback(
    (data: Omit<Waypoint, 'id' | 'position'>) => {
      if (form.open && form.mode === 'create') {
        createWaypoint(data, form.position);
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
      {/* NEXT_PUBLIC_SITE_COLOR and NEXT_PUBLIC_SITE_NOTICE (app/lib/project.ts)
          let a site, e.g. a demo, look different so nobody mistakes which one they're on. */}
      <div
        data-testid="app-header"
        className={`relative px-4 py-2 border-b border-gray-200 shrink-0 text-center ${SITE_COLOR ? '' : 'bg-black'}`}
        style={SITE_COLOR ? { backgroundColor: SITE_COLOR } : undefined}
      >
        <h1 className="text-4xl font-bold text-white">Cognitive Tours</h1>
        <p className="text-lg font-bold text-gray-200 mt-1">Understanding as a Deliverable</p>
        {SITE_NOTICE && (
          <p data-testid="site-notice" role="note" className="text-sm font-semibold text-yellow-200 mt-1">
            {SITE_NOTICE}
          </p>
        )}
        {PROJECT_NAME && (
          // Pinned in the header's empty left side so it adds no height.
          (() => {
            const pillClass =
              'absolute left-4 top-1/2 -translate-y-1/2 max-w-[30%] truncate px-3 py-0.5 rounded-full bg-white text-black text-sm font-semibold';
            // With a known repo, the label opens it on GitHub.
            return repoUrl ? (
              <a
                data-testid="project-name"
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                title={`Project: ${PROJECT_NAME} (open repo on GitHub)`}
                className={`${pillClass} hover:bg-gray-200 underline-offset-2 hover:underline`}
              >
                Project: {PROJECT_NAME} ↗
              </a>
            ) : (
              <p data-testid="project-name" title={`Project: ${PROJECT_NAME}`} className={pillClass}>
                Project: {PROJECT_NAME}
              </p>
            );
          })()
        )}
        {/* Pinned right, mirroring the Project pill: the Start here walkthrough, and the
            plugin's commands with this site filled in. */}
        {/* No transform here: it would make the fixed-position walkthrough and skills panel inside it position relative to this box. */}
        <div className="absolute right-4 inset-y-0 flex items-center gap-2">
          <StartHere
            mapIsEmpty={waypoints.length === 0}
            hasTours={tours.length > 0}
            onShowTour={showTourForStartHere}
          />
          <span data-start-here="skills">
            <ClaudeCodeSkillsButton mapIsEmpty={waypoints.length === 0} />
          </span>
        </div>
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
        onSelectTour={selectTour}
        onCreateTour={createTour}
        onUpdateTour={updateTour}
        onDeleteTour={deleteTour}
        waypoints={waypoints}
        isNewStop={isNewStop}
        onStopSeen={(tourId, waypointId) => markStopsSeen([stopKey(tourId, waypointId)])}
        markdownViewOpen={markdownViewOpen}
        onToggleMarkdownView={onToggleMarkdownView}
        onEditorOpenChange={setTourEditorOpen}
        filterState={filterState}
        onFilterChange={(type, visible) => setFilterState(prev => ({ ...prev, [type]: visible }))}
        newOnly={newOnly}
        newCount={newWaypointIds.size}
        onNewOnlyChange={setNewOnly}
        onExitTour={() => selectTour(null)}
        // Exactly one Exit on screen: the top-bar one whenever Tour Controls'
        // own isn't visible (collapsed, or hidden entirely in markdown view).
        showExitTour={controlPanelCollapsed || markdownViewOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        <div data-start-here="map" className="flex-1 relative overflow-hidden">
          {showingMarkdown ? (
            <TourMarkdownView tour={activeTour} waypoints={waypoints} activeStepIndex={activeTourStep} />
          ) : (
            <WaypointGraph
              waypoints={waypoints}
              edges={edges}
              selectedWaypointId={selectedWaypointId}
              activeTourWaypointIds={activeTour?.stops.map(s => s.waypointId) ?? []}
              onSelectWaypoint={selectWaypoint}
              onEditWaypoint={editWaypointById}
              onConnect={addEdge}
              onDeleteEdge={deleteEdge}
              onDeleteWaypoint={deleteWaypoint}
              onNodePositionChange={onNodePositionChange}
              onAddWaypointClick={openCreateForm}
              filterState={filterState}
              newOnlyIds={newOnly ? newWaypointIds : null}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              tourName={activeTour?.name}
              tourDescription={activeTour?.description}
              panelCollapsed={panelCollapsed}
              tourOverview={tourOverview}
              placementRef={placementRef}
              isNewWaypoint={isNewWaypoint}
              makeRoomFor={makeRoomFor}
              onRoomMade={onRoomMade}
              justCreatedIds={glowingCreated}
              focusRequest={focusRequest}
            />
          )}
        </div>
        {!showingMarkdown && (
          panelCollapsed ? (
            <div className="w-8 border-l border-gray-200 bg-white shrink-0 flex flex-col items-center pt-3">
              <button
                onClick={() => setPanelCollapsed(false)}
                title="Expand waypoint panel"
                className="text-blue-700 hover:text-blue-900 text-sm font-semibold [writing-mode:vertical-rl]"
              >
                Waypoints «
              </button>
            </div>
          ) : (
            <div className="w-80 border-l border-gray-200 bg-white overflow-hidden shrink-0">
              <WaypointDetail
                waypoint={selectedWaypoint}
                onEdit={openEditForm}
                onDelete={deleteWaypoint}
                hasActiveTour={!!activeTour}
                onAddWaypointClick={openCreateForm}
                onCollapse={() => setPanelCollapsed(true)}
                tourSuspended={tourSuspended}
                onResumeTour={resumeTour}
              />
            </div>
          )
        )}
        {activeTour && !showingMarkdown && (
          controlPanelCollapsed ? (
            <div className="w-8 border-l border-gray-200 bg-white shrink-0 flex flex-col items-center pt-3">
              <button
                onClick={() => setControlPanelCollapsed(false)}
                title="Expand tour controls panel"
                className="text-green-700 hover:text-green-900 text-sm font-semibold [writing-mode:vertical-rl]"
              >
                Tour «
              </button>
            </div>
          ) : (
            <div data-start-here="tour-controls" className="w-96 border-l border-gray-200 bg-white overflow-hidden shrink-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
                  <h2 className="text-lg font-bold text-gray-900">Tour Controls</h2>
                  <button
                    onClick={() => setControlPanelCollapsed(true)}
                    title="Collapse tour controls panel"
                    className="text-gray-400 hover:text-gray-700 text-sm px-1"
                  >
                    »
                  </button>
                </div>
                <div className="p-4 border-b border-gray-200 flex flex-col gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrev}
                      disabled={activeTourStep === 0}
                      className="px-3 py-1.5 text-base font-medium border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-100 text-gray-700"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={isLastTourStep}
                      className="px-3 py-1.5 text-base font-semibold text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 disabled:opacity-40 disabled:hover:bg-green-600"
                    >
                      Next →
                    </button>
                    <button
                      onClick={() => selectTour(null)}
                      className="px-3 py-1.5 text-base font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700"
                    >
                      Exit tour
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-medium text-gray-700 tabular-nums">
                      Step {activeTourStep + 1} of {activeTourLength}
                    </span>
                    <button
                      onClick={() => setTourOverview(o => !o)}
                      className="px-2.5 py-1 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-100 text-gray-700"
                    >
                      {tourOverview ? 'Back to stop' : 'Show whole tour'}
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                  {currentStopWaypoint && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-start gap-2">
                        <span
                          className={`inline-block shrink-0 mt-0.5 px-2 py-0.5 rounded text-sm font-medium border ${WAYPOINT_COLORS[currentStopWaypoint.type]}`}
                        >
                          {currentStopWaypoint.type}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 leading-snug">
                          {currentStopWaypoint.label}
                        </h3>
                      </div>
                      {currentStopWaypoint.description && (
                        <p
                          ref={stopDescriptionRef}
                          className={`text-base text-gray-700 leading-relaxed ${
                            stopTextExpanded ? '' : 'line-clamp-10'
                          }`}
                        >
                          {currentStopWaypoint.description}
                        </p>
                      )}
                      {currentStopWaypoint.notes && (stopTextExpanded || !stopDescriptionOverflowing) && (
                        <div className="text-base text-gray-500">
                          <div className="font-medium text-gray-600 mb-0.5">Notes</div>
                          <p
                            ref={stopNotesRef}
                            className={`leading-relaxed ${stopTextExpanded ? '' : 'line-clamp-3'}`}
                          >
                            {currentStopWaypoint.notes}
                          </p>
                        </div>
                      )}
                      {(stopTextExpanded
                        ? currentStopWaypoint.description || currentStopWaypoint.notes
                        : stopDescriptionOverflowing || stopNotesOverflowing) && (
                        <button
                          onClick={() => setStopTextExpanded(e => !e)}
                          className="self-start text-sm font-medium text-blue-600 hover:underline"
                        >
                          {stopTextExpanded ? 'Less' : 'More'}
                        </button>
                      )}
                      {currentStopWaypoint.filePath && (
                        <div className="text-sm text-gray-500 border-t pt-3">
                          <div className="font-medium text-gray-600 mb-1">
                            Linked artifact for the current waypoint
                          </div>
                          <p className="font-mono text-sm text-gray-700 break-all mb-2">
                            {currentStopWaypoint.filePath}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(currentStopWaypoint.filePath!).catch(() => {});
                                setStopLinkCopied(true);
                                setTimeout(() => setStopLinkCopied(false), 2000);
                              }}
                              className="px-2 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50"
                            >
                              {stopLinkCopied ? (
                                <span className="text-green-600 font-medium">Copied!</span>
                              ) : (
                                'Copy path'
                              )}
                            </button>
                            {(() => {
                              const webLink = githubFileLink(repoUrl, currentStopWaypoint.filePath);
                              return webLink ? (
                                <a
                                  href={webLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50"
                                >
                                  {linkLabel(webLink)}
                                </a>
                              ) : null;
                            })()}
                            {vscodeLink(codeFolder, currentStopWaypoint.filePath) && (
                              <a
                                href={vscodeLink(codeFolder, currentStopWaypoint.filePath) ?? undefined}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50"
                              >
                                Open in VS Code
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                      {currentNarrative && (
                        <div
                          data-testid="docent-narrative-bar"
                          className="text-base text-amber-800 bg-amber-50 border border-amber-400 rounded-lg px-3 py-2"
                        >
                          <div className="font-bold mb-0.5">Next stop</div>
                          {currentNarrative}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => setPanelCollapsed(false)}
                    className="text-sm text-gray-400 hover:text-gray-600 hover:underline self-start mt-auto"
                  >
                    Open the Waypoint panel to edit →
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
      {form.open && (
        <WaypointForm
          mode={form.mode}
          initialValues={form.mode === 'edit' ? form.waypoint : undefined}
          onSave={handleFormSave}
          onCancel={closeForm}
          onDescriptionFocus={
            form.mode === 'edit'
              ? () => {
                  markWaypointsSeen([form.waypoint.id]);
                  clearJustCreated(form.waypoint.id);
                }
              : undefined
          }
        />
      )}
      {undoToast && (
        <div
          data-testid="undo-toast"
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-lg bg-gray-900 px-4 py-2.5 text-base text-white shadow-lg"
        >
          <span>{undoMessage(undoToast)}</span>
          <button
            onClick={undoLast}
            className="font-semibold text-amber-300 hover:text-amber-200 hover:underline"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
