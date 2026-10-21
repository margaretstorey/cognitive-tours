'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Each person's local copy of the repo lives somewhere different, so the
 * folder used to build "Open in VS Code" links is a per-browser setting,
 * remembered in localStorage — never a per-site value.
 */
const STORAGE_KEY = 'cognitiveTours.codeFolder';
// The storage event only fires in *other* tabs; this one syncs views in this tab.
const CHANGE_EVENT = 'cognitiveTours:codeFolder';

function readFolder(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null; // storage blocked (e.g. some private windows)
  }
}

export function useCodeFolder(): [string | null, (folder: string | null) => void] {
  // Read after mount so the server render and first client render match.
  const [folder, setFolderState] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setFolderState(readFolder());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  const setFolder = useCallback((next: string | null) => {
    const value = next?.trim() || null;
    try {
      if (value) window.localStorage.setItem(STORAGE_KEY, value);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage blocked: keep the value for this page view only.
    }
    setFolderState(value);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [folder, setFolder];
}

/** vscode://file link for a repo-relative path, or null when no folder is set. */
export function vscodeLink(folder: string | null, filePath: string): string | null {
  // A full http(s) link has no local copy to open.
  if (!folder || /^https?:\/\//i.test(filePath.trim())) return null;
  const root = folder.replace(/\\/g, '/').replace(/\/+$/, '');
  const rel = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  return `vscode://file/${root.replace(/^\/+/, '')}/${rel}`;
}
