'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

// A short "Start here" walkthrough of the screen (Nov 7, after floorplan's
// one-minute intro). It runs on a browser's first visit to a site and can be
// replayed from the header button. Each step highlights one part of the
// screen, found by a CSS selector; nothing about the map's data changes.

export const START_HERE_SEEN_KEY = 'cognitive-tours:start-here-seen';

type Step = {
  target: string;
  title: string;
  body: string;
  /** Start the first tour before showing this step, so Tour Controls is on screen. */
  showTour?: boolean;
};

const MAP = '[data-start-here="map"]';
const SKILLS = '[data-start-here="skills"]';

function stepsFor(mapIsEmpty: boolean, hasTours: boolean): Step[] {
  if (mapIsEmpty) {
    return [
      {
        target: MAP,
        title: 'This map is empty',
        body:
          'A map holds waypoints, the places worth knowing in a project: goals, needs, decisions, code, tests and open questions. Tours are guided walks through them, written by people. Start with Add first waypoint.',
      },
      {
        target: SKILLS,
        title: 'Or start from a draft',
        body:
          'Claude Code skills shows how to draft a starting map from your repo with Claude Code, for you to check and rewrite in your own words.',
      },
    ];
  }
  const steps: Step[] = [
    {
      target: MAP,
      title: 'The map',
      body:
        'Each box is a waypoint: a goal, a need, a decision, some code, a test or an open question. Lines show how they relate. Drag to move around, scroll to zoom, click a box to read it.',
    },
  ];
  if (hasTours) {
    steps.push(
      {
        target: '#tour-select',
        title: 'Tours',
        body:
          'A tour is a guided walk through the map, written by a person to explain how the pieces connect, from why to code. Pick one here.',
      },
      {
        target: '[data-start-here="tour-controls"]',
        title: 'Step through a tour',
        body:
          'Use Next and Prev. Each stop says what it is and how it leads to the next, and links to its code in VS Code or on GitHub. Exit tour (or Esc) takes you back to the whole map.',
        showTour: true,
      },
    );
  }
  steps.push({
    target: SKILLS,
    title: 'Make your own',
    body:
      'Add Waypoint and + New Tour let you write your own. Claude Code skills drafts a starting map from your repo, for you to check and rewrite in your own words.',
  });
  return steps;
}

function readSeen(): boolean {
  try {
    return localStorage.getItem(START_HERE_SEEN_KEY) === '1';
  } catch {
    return true; // storage blocked: don't pop up on every visit
  }
}

function markSeen() {
  try {
    localStorage.setItem(START_HERE_SEEN_KEY, '1');
  } catch {
    // storage blocked; nothing to remember
  }
}

const CARD_WIDTH = 320;
const GAP = 12;

export function StartHere({
  mapIsEmpty,
  hasTours,
  onShowTour,
}: {
  mapIsEmpty: boolean;
  hasTours: boolean;
  onShowTour: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const steps = useMemo(() => stepsFor(mapIsEmpty, hasTours), [mapIsEmpty, hasTours]);
  const step = open ? steps[Math.min(index, steps.length - 1)] : null;

  // First visit to this site in this browser: open once. The timeout keeps
  // the state change out of the effect body and lets the map lay out first.
  useEffect(() => {
    if (readSeen()) return;
    const t = setTimeout(() => setOpen(true), 300);
    return () => clearTimeout(t);
  }, []);

  const close = useCallback(() => {
    markSeen();
    setOpen(false);
    setIndex(0);
    setRect(null);
  }, []);

  // Escape closes the walkthrough only. Capture phase on window, so the app's
  // own Escape handler (which exits an active tour) never sees it.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      close();
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [open, close]);

  // Show the tour this step needs, then find the step's target. Tour Controls
  // appears a render later, so look for it for up to a second.
  useLayoutEffect(() => {
    if (!step) return;
    if (step.showTour) onShowTour();
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const find = () => {
      const el = document.querySelector(step.target);
      if (el) {
        setRect(el.getBoundingClientRect());
      } else if (tries++ < 20) {
        timer = setTimeout(find, 50);
      } else {
        setRect(null); // not on screen: the card shows in the middle
      }
    };
    find();
    const onResize = () => {
      const el = document.querySelector(step.target);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    window.addEventListener('resize', onResize);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [step, onShowTour]);

  useEffect(() => {
    if (open) nextRef.current?.focus();
  }, [open, index]);

  const replay = () => {
    setIndex(0);
    setOpen(true);
  };

  const last = index >= steps.length - 1;

  let cardStyle: React.CSSProperties;
  if (rect && typeof window !== 'undefined') {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const big = rect.width * rect.height > vw * vh * 0.3;
    if (big) {
      cardStyle = {
        left: rect.left + rect.width / 2 - CARD_WIDTH / 2,
        top: rect.top + Math.min(rect.height / 2 - 100, 120),
      };
    } else if (rect.height > vh * 0.5) {
      // Tall and narrow (a side panel): beside it, on whichever side has room.
      const roomLeft = rect.left - GAP - CARD_WIDTH >= 16;
      cardStyle = {
        left: roomLeft ? rect.left - GAP - CARD_WIDTH : Math.min(rect.right + GAP, vw - CARD_WIDTH - 16),
        top: Math.max(16, rect.top + 40),
      };
    } else {
      const left = Math.max(16, Math.min(rect.left, vw - CARD_WIDTH - 16));
      const below = rect.bottom + GAP + 220 < vh;
      cardStyle = below ? { left, top: rect.bottom + GAP } : { left, bottom: vh - rect.top + GAP };
    }
  } else {
    cardStyle = { left: '50%', top: '30%', transform: 'translateX(-50%)' };
  }

  return (
    <>
      <button
        onClick={replay}
        className="rounded-full border border-white/70 px-3 py-0.5 text-sm font-semibold text-white hover:bg-white/15"
      >
        Start here
      </button>
      {step && (
        <>
          {/* Highlight: a ring around the target, with the rest of the screen dimmed. */}
          {rect && (
            <div
              aria-hidden
              data-testid="start-here-highlight"
              className="pointer-events-none fixed z-40 rounded-lg ring-4 ring-amber-400"
              style={{
                left: rect.left - 4,
                top: rect.top - 4,
                width: rect.width + 8,
                height: rect.height + 8,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
              }}
            />
          )}
          <div
            role="dialog"
            aria-label="Start here"
            className="fixed z-50 rounded-lg bg-white p-4 text-left text-sm text-gray-700 shadow-xl"
            style={{ width: CARD_WIDTH, ...cardStyle }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Start here · {index + 1} of {steps.length}
            </p>
            <h2 className="mt-1 text-base font-semibold text-gray-900">{step.title}</h2>
            <p className="mt-1">{step.body}</p>
            <div className="mt-3 flex items-center gap-2">
              <button onClick={close} className="text-xs text-gray-500 underline hover:text-gray-700">
                Skip
              </button>
              <span className="flex-1" />
              {index > 0 && (
                <button
                  onClick={() => setIndex(i => i - 1)}
                  className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
              )}
              <button
                ref={nextRef}
                onClick={() => (last ? close() : setIndex(i => i + 1))}
                className="rounded bg-gray-900 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-700"
              >
                {last ? 'Done' : 'Next'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
