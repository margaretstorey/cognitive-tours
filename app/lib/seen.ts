'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Tour, Waypoint } from '@/app/lib/types';

/**
 * What this browser has already seen on this site, so things added since
 * (by a Claude Code skill, or a teammate) can wear a red "new" halo until
 * someone clicks them or writes in them. Per browser and per site
 * (localStorage is per origin). On a browser's first visit everything
 * already there counts as seen, so nothing lights up the first time.
 */
const STORAGE_KEY = 'cognitiveTours.seen';

type SeenData = { waypoints: string[]; stops: string[] };

export const stopKey = (tourId: string, waypointId: string) => `${tourId}:${waypointId}`;

function read(): SeenData | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SeenData>;
    return { waypoints: parsed.waypoints ?? [], stops: parsed.stops ?? [] };
  } catch {
    return null; // missing, unreadable or storage blocked
  }
}

function write(waypoints: Set<string>, stops: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ waypoints: [...waypoints], stops: [...stops] }));
  } catch {
    // Storage blocked: remember for this page view only.
  }
}

export function useSeen(waypoints: Waypoint[], tours: Tour[], loaded: boolean) {
  // null until the map has loaded, so nothing shows as new before then.
  const [seen, setSeen] = useState<{ waypoints: Set<string>; stops: Set<string> } | null>(null);
  // Waypoints that were new (and undescribed) when this page loaded.
  const [newAtLoad, setNewAtLoad] = useState<string[]>([]);
  const started = useRef(false);

  useEffect(() => {
    if (!loaded || started.current) return;
    started.current = true;
    const stored = read();
    const w = new Set(stored?.waypoints ?? waypoints.map(x => x.id));
    const s = new Set(stored?.stops ?? tours.flatMap(t => t.stops.map(st => stopKey(t.id, st.waypointId))));
    if (!stored) write(w, s); // first visit: everything here is the baseline
    setSeen({ waypoints: w, stops: s });
    setNewAtLoad(waypoints.filter(x => !w.has(x.id) && !x.description?.trim()).map(x => x.id));
  }, [loaded, waypoints, tours]);

  // Waypoints that turned up after the first load (the map refreshes itself
  // when you come back to the tab), new to this browser and undescribed: the
  // map makes room around them, as it does for newAtLoad. Ones you create or
  // restore here are marked seen first, so they never appear in this list.
  const known = useRef<Set<string> | null>(null);
  const [arrivedAfterLoad, setArrivedAfterLoad] = useState<string[]>([]);
  useEffect(() => {
    if (!seen) return;
    if (!known.current) {
      known.current = new Set(waypoints.map(x => x.id));
      return;
    }
    const fresh = waypoints.filter(x => !known.current!.has(x.id));
    if (fresh.length === 0) return;
    fresh.forEach(x => known.current!.add(x.id));
    const arrived = fresh.filter(x => !seen.waypoints.has(x.id) && !x.description?.trim()).map(x => x.id);
    if (arrived.length > 0) setArrivedAfterLoad(prev => [...prev, ...arrived]);
  }, [waypoints, seen]);

  const markWaypointsSeen = useCallback((ids: string[]) => {
    setSeen(prev => {
      if (!prev || ids.every(id => prev.waypoints.has(id))) return prev;
      const w = new Set(prev.waypoints);
      ids.forEach(id => w.add(id));
      write(w, prev.stops);
      return { waypoints: w, stops: prev.stops };
    });
  }, []);

  const markStopsSeen = useCallback((keys: string[]) => {
    setSeen(prev => {
      if (!prev || keys.every(k => prev.stops.has(k))) return prev;
      const s = new Set(prev.stops);
      keys.forEach(k => s.add(k));
      write(prev.waypoints, s);
      return { waypoints: prev.waypoints, stops: s };
    });
  }, []);

  /** New to this browser and not yet given a description. */
  const isNewWaypoint = useCallback(
    (w: Waypoint) => !!seen && !seen.waypoints.has(w.id) && !w.description?.trim(),
    [seen],
  );

  /** A stop new to this browser that has no narrative yet. */
  const isNewStop = useCallback(
    (tourId: string, waypointId: string, narrative: string | null | undefined) =>
      !!seen && !seen.stops.has(stopKey(tourId, waypointId)) && !narrative?.trim(),
    [seen],
  );

  return { newAtLoad, arrivedAfterLoad, isNewWaypoint, isNewStop, markWaypointsSeen, markStopsSeen };
}
