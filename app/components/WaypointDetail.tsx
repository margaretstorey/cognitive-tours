'use client';

import { useState } from 'react';
import type { Waypoint } from '@/app/lib/types';
import { WAYPOINT_COLORS } from '@/app/lib/waypoint-colors';
import { useCodeFolder, vscodeLink } from '@/app/lib/code-folder';
import { githubFileLink, normalizeGitHubRepo, SITE_REPO_URL, useRepoUrl } from '@/app/lib/repo';

interface WaypointDetailProps {
  waypoint: Waypoint | null;
  onEdit: (waypoint: Waypoint) => void;
  onDelete: (id: string) => void;
  hasActiveTour: boolean;
  onAddWaypointClick: () => void;
  onCollapse?: () => void;
  tourSuspended?: boolean;
  onResumeTour?: () => void;
}

export default function WaypointDetail({
  waypoint,
  onEdit,
  onDelete,
  hasActiveTour,
  onAddWaypointClick,
  onCollapse,
  tourSuspended,
  onResumeTour,
}: WaypointDetailProps) {
  const [copied, setCopied] = useState(false);
  const [codeFolder, setCodeFolder] = useCodeFolder();
  const [editingFolder, setEditingFolder] = useState(false);
  const [folderDraft, setFolderDraft] = useState('');

  const { repoUrl, setRepoUrl, isOwnSetting } = useRepoUrl();
  const [editingRepo, setEditingRepo] = useState(false);
  const [repoDraft, setRepoDraft] = useState('');
  const [repoError, setRepoError] = useState(false);

  // Only one inline setting form open at a time.
  const startEditingFolder = () => {
    setFolderDraft(codeFolder ?? '');
    setEditingRepo(false);
    setEditingFolder(true);
  };

  const startEditingRepo = () => {
    setRepoDraft(repoUrl ?? '');
    setRepoError(false);
    setEditingFolder(false);
    setEditingRepo(true);
  };

  // Drop this browser's own repo, falling back to the site's (or none).
  const clearOwnRepo = () => {
    setRepoUrl(null);
    setEditingRepo(false);
  };

  const saveRepo = () => {
    if (!repoDraft.trim()) {
      clearOwnRepo();
      return;
    }
    const normalized = normalizeGitHubRepo(repoDraft);
    if (!normalized) {
      setRepoError(true);
      return;
    }
    setRepoUrl(normalized);
    setEditingRepo(false);
  };

  const header = (
    <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
      <h2 className="text-base font-bold text-gray-900">Waypoint panel</h2>
      {onCollapse && (
        <button
          onClick={onCollapse}
          title="Collapse waypoint panel"
          className="text-gray-400 hover:text-gray-700 text-xs px-1"
        >
          »
        </button>
      )}
    </div>
  );

  const resumeTourBanner = tourSuspended && onResumeTour && (
    <div className="p-4 border-b border-gray-200 shrink-0">
      <button
        onClick={onResumeTour}
        className="w-full px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700"
      >
        ↩ Resume tour
      </button>
    </div>
  );

  const addWaypointButton = (
    <button
      onClick={onAddWaypointClick}
      className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs shadow-sm hover:bg-gray-50"
    >
      + Add Waypoint
    </button>
  );

  if (!waypoint) {
    if (hasActiveTour) {
      return (
        <div className="flex flex-col h-full">
          {header}
          {resumeTourBanner}
          <div className="flex gap-2 p-4 border-b border-gray-200 shrink-0">{addWaypointButton}</div>
          <div className="flex flex-1 items-center justify-center p-6 text-center text-gray-400 text-xs">
            Select a waypoint to see its details.
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {header}
        {resumeTourBanner}
        <div className="flex gap-2 p-4 border-b border-gray-200 shrink-0">{addWaypointButton}</div>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 text-xs text-gray-600">
          <p className="text-base text-red-700 font-bold">
            Select a tour to begin understanding, or create a new one
          </p>
          <h2 className="text-sm font-semibold text-gray-800">Getting oriented</h2>
          <p>
            A <span className="font-medium text-gray-700">waypoint</span> is a single point of
            understanding — a goal, feature, decision, or piece of code worth remembering. A{' '}
            <span className="font-medium text-gray-700">tour</span> strings waypoints together into
            a guided path through intent and implementation.
          </p>
          <p>Select a waypoint to see its details or create a new waypoint.</p>
        </div>
      </div>
    );
  }

  const colorClass = WAYPOINT_COLORS[waypoint.type];

  return (
    <div className="flex flex-col h-full">
      {header}
      {resumeTourBanner}
      <div className="flex gap-2 p-4 border-b border-gray-200 shrink-0">
        <button
          onClick={() => onEdit(waypoint)}
          className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(waypoint.id)}
          className="flex-1 px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
        >
          Delete
        </button>
        {addWaypointButton}
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <span className={`inline-block self-start px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
          {waypoint.type}
        </span>
        <h2 className="text-sm font-semibold text-gray-900 leading-snug">{waypoint.label}</h2>
        {waypoint.description && (
          <p className="text-xs text-gray-700 leading-relaxed">{waypoint.description}</p>
        )}
        {waypoint.notes && (
          <div className="text-xs text-gray-500 border-t pt-3">
            <div className="font-medium text-gray-600 mb-1">Notes</div>
            <p className="leading-relaxed">{waypoint.notes}</p>
          </div>
        )}
        {waypoint.filePath && (
          <div className="text-xs text-gray-500 border-t pt-3">
            <div className="font-medium text-gray-600 mb-1">Linked artifact</div>
            <p className="font-mono text-xs text-gray-700 break-all mb-2">{waypoint.filePath}</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(waypoint.filePath!).catch(() => {});
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
              >
                {copied ? <span className="text-green-600 font-medium">Copied!</span> : 'Copy path'}
              </button>
              {repoUrl ? (
                <a
                  href={githubFileLink(repoUrl, waypoint.filePath) ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                >
                  View on GitHub
                </a>
              ) : (
                !editingRepo && (
                  <button
                    onClick={startEditingRepo}
                    className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                  >
                    Set your team&apos;s GitHub repo
                  </button>
                )
              )}
              {codeFolder ? (
                <a
                  href={vscodeLink(codeFolder, waypoint.filePath) ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                >
                  Open in VS Code
                </a>
              ) : (
                !editingFolder && (
                  <button
                    onClick={startEditingFolder}
                    className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                  >
                    Set your code folder to open in VS Code
                  </button>
                )
              )}
            </div>
            {codeFolder && !editingFolder && (
              <button
                onClick={startEditingFolder}
                className="mt-1.5 text-xs text-gray-400 hover:text-gray-600 hover:underline"
              >
                change folder ({codeFolder})
              </button>
            )}
            {editingFolder && (
              <div className="mt-2 flex flex-col gap-1.5">
                <input
                  type="text"
                  aria-label="Your code folder"
                  value={folderDraft}
                  onChange={e => setFolderDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { setCodeFolder(folderDraft); setEditingFolder(false); }
                    if (e.key === 'Escape') setEditingFolder(false);
                  }}
                  placeholder="e.g. /Users/you/code/your-repo"
                  className="border border-gray-300 rounded px-2 py-1 text-xs font-mono"
                  autoFocus
                />
                <p className="text-gray-400">Where your copy of the repo lives. Saved in this browser only.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setCodeFolder(folderDraft); setEditingFolder(false); }}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingFolder(false)}
                    className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {repoUrl && !editingRepo && (
              <button
                onClick={startEditingRepo}
                className="mt-1.5 block text-xs text-gray-400 hover:text-gray-600 hover:underline"
              >
                change repo
              </button>
            )}
            {editingRepo && (
              <div className="mt-2 flex flex-col gap-1.5">
                <input
                  type="text"
                  aria-label="Your team's GitHub repo"
                  value={repoDraft}
                  onChange={e => { setRepoDraft(e.target.value); setRepoError(false); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveRepo();
                    if (e.key === 'Escape') setEditingRepo(false);
                  }}
                  placeholder="https://github.com/your-org/your-repo"
                  className="border border-gray-300 rounded px-2 py-1 text-xs font-mono"
                  autoFocus
                />
                {repoError ? (
                  <p className="text-red-600">That doesn&apos;t look like a GitHub repo link.</p>
                ) : !isOwnSetting && SITE_REPO_URL ? (
                  <p className="text-gray-400">
                    Your team&apos;s default is set by your instructor. Saving here overrides it in this browser only.
                  </p>
                ) : (
                  <p className="text-gray-400">Paste the address of your repo on GitHub. Saved in this browser only.</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={saveRepo}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingRepo(false)}
                    className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  {isOwnSetting && (
                    <button
                      onClick={clearOwnRepo}
                      className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                    >
                      {SITE_REPO_URL
                        ? `Use team default (${SITE_REPO_URL.replace('https://github.com/', '')})`
                        : 'Remove my repo setting'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
