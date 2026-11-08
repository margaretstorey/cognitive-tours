'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

// The Cognitive Tours plugin for Claude Code (plugins/cognitive-tours in the
// repo). A web page can't run a skill (skills run in the user's terminal, in
// their own checkout), so the site hands over each command with its own
// address filled in.
export const PLUGIN_INSTALL_URL = 'https://github.com/margaretstorey/cognitive-tours#skills-for-claude-code';
const MARKETPLACE = 'margaretstorey/cognitive-tours';
export const INSTALL_TERMINAL = `claude plugin install cognitive-tours --marketplace ${MARKETPLACE}`;
const INSTALL_IN_CLAUDE = `/plugin install cognitive-tours --marketplace ${MARKETPLACE}`;

export function skillCommand(skill: string, origin: string): string {
  return `/cognitive-tours:${skill} site ${origin}`;
}

const noSubscribe = () => () => {};

// This site's address; '' during server rendering.
export function useSiteOrigin(): string {
  return useSyncExternalStore(noSubscribe, () => window.location.origin, () => '');
}

// A command in a code box, with a Copy button that says "Copied" for 2s.
export function CopyCommand({
  command,
  testId,
  copyLabel = 'Copy',
}: {
  command: string;
  testId?: string;
  copyLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(command).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {},
    );
  };

  return (
    <div className="flex items-start gap-2">
      {/* Wraps instead of truncating, so the whole command (site address included) can be read before copying. */}
      <code data-testid={testId} className="min-w-0 flex-1 whitespace-normal break-all rounded bg-gray-100 px-2 py-1 text-xs">
        {command}
      </code>
      <button
        onClick={copy}
        className="shrink-0 rounded border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
      >
        {copied ? 'Copied' : copyLabel}
      </button>
    </div>
  );
}

const SKILLS: { name: string; when: string }[] = [
  { name: 'first-tours', when: 'A repo you don’t know yet: drafts a starting map, for you to check and rewrite.' },
  { name: 'suggest-waypoint', when: 'After a work session: asks you about what changed, so you record it.' },
  { name: 'suggest-tour', when: 'Fits new waypoints into tours; you write each stop’s narrative.' },
  { name: 'audit-waypoints', when: 'Checks waypoints against the code they link to.' },
  { name: 'audit-tours', when: 'Finds recent changes no waypoint or tour covers, and stale narratives.' },
];

// Header button and modal listing the plugin's skills with this site's address.
export function ClaudeCodeSkillsButton({ mapIsEmpty }: { mapIsEmpty: boolean }) {
  const [open, setOpen] = useState(false);
  const origin = useSiteOrigin();

  // Escape closes the panel. Capture phase on window, so it runs before the
  // app's own Escape handler (which exits an active tour) and stops there.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-white/70 px-3 py-0.5 text-sm font-semibold text-white hover:bg-white/15"
      >
        Claude Code skills
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 text-left"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="claude-code-skills-title"
            className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-2 shrink-0">
              <h2 id="claude-code-skills-title" className="text-base font-semibold text-gray-900">
                Claude Code skills for this map
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-700 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex flex-col gap-4 px-6 pb-6 overflow-y-auto text-sm text-gray-700">
              <p>
                Five skills for <a className="underline" href="https://claude.com/claude-code" target="_blank" rel="noopener noreferrer">Claude Code</a>,
                run in your own repo. Apart from first-tours, they ask you questions and report; you write
                the map yourself.
              </p>

              <section aria-label="Install">
                <h3 className="font-semibold text-gray-900">1. Install once, in your terminal</h3>
                <div className="mt-1.5">
                  <CopyCommand command={INSTALL_TERMINAL} testId="install-command" />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Or inside Claude Code: <code>{INSTALL_IN_CLAUDE}</code>.{' '}
                  <a className="underline hover:text-gray-700" href={PLUGIN_INSTALL_URL} target="_blank" rel="noopener noreferrer">
                    More
                  </a>
                </p>
              </section>

              <section aria-label="Skills">
                <h3 className="font-semibold text-gray-900">2. Then, in Claude Code, in your repo’s folder</h3>
                <p className="mt-1" data-testid="first-time-note">
                  The first time, copy a full command below: it tells the skill which map is yours, and the
                  skill offers to remember it. After that, just type <code>/cognitive-tours:</code> and the
                  skill’s name. Or just ask Claude Code in your own words, e.g. “make a starting map of
                  this repo” or “help me record what I just did”.
                </p>
                <ul className="mt-1.5 flex flex-col gap-3">
                  {SKILLS.map((s) => (
                    <li key={s.name} data-testid={`skill-${s.name}`}>
                      <p>
                        <span className="font-medium text-gray-900">{s.name}</span>: {s.when}
                        {s.name === 'first-tours' && !mapIsEmpty && (
                          <span className="text-amber-700"> Meant for an empty map; this one isn’t.</span>
                        )}
                      </p>
                      <div className="mt-1">
                        <CopyCommand command={skillCommand(s.name, origin)} testId={`command-${s.name}`} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
