'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * The team's GitHub repo, used for "View on GitHub" links and the project
 * label. Two sources, browser first: a value someone saved in this browser
 * (localStorage is per site, so per team), then the site-wide
 * NEXT_PUBLIC_REPO_URL the instructor can set on the Vercel project.
 */
const STORAGE_KEY = 'cognitiveTours.repoUrl';
// The storage event only fires in *other* tabs; this one syncs views in this tab.
const CHANGE_EVENT = 'cognitiveTours:repoUrl';

/** Turns the forms people paste into https://github.com/org/repo, or null. */
export function normalizeGitHubRepo(input: string): string | null {
  const s = input.trim();
  const ssh = s.match(/^git@github\.com:([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/);
  if (ssh) return `https://github.com/${ssh[1]}/${ssh[2]}`;
  const https = s.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#].*)?$/);
  if (https) return `https://github.com/${https[1]}/${https[2]}`;
  return null;
}

export const SITE_REPO_URL: string | null = normalizeGitHubRepo(process.env.NEXT_PUBLIC_REPO_URL ?? '');

function readOwn(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null; // storage blocked (e.g. some private windows)
  }
}

export function useRepoUrl(): {
  repoUrl: string | null;
  setRepoUrl: (url: string | null) => void;
  isOwnSetting: boolean;
} {
  // Read after mount so the server render and first client render match.
  const [own, setOwn] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setOwn(readOwn());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  const setRepoUrl = useCallback((url: string | null) => {
    try {
      if (url) window.localStorage.setItem(STORAGE_KEY, url);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage blocked: keep the value for this page view only.
    }
    setOwn(url);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { repoUrl: own ?? SITE_REPO_URL, setRepoUrl, isOwnSetting: own !== null };
}

/**
 * A filePath that is a full http(s) link (e.g. a file in another repo, or a
 * customer-notes doc) is used as-is rather than resolved against the repo.
 */
export function isLinkPath(filePath: string): boolean {
  return /^https?:\/\//i.test(filePath.trim());
}

/** "View on GitHub" for github.com links, "Open link" for anything else. */
export function linkLabel(url: string): string {
  return /^https?:\/\/(www\.)?github\.com\//i.test(url) ? 'View on GitHub' : 'Open link';
}

/**
 * Link to a repo-relative file on the default branch (HEAD); a link path is
 * returned as-is, even with no repo set. Null when there is nothing to link to.
 */
export function githubFileLink(repoUrl: string | null, filePath: string): string | null {
  if (isLinkPath(filePath)) return filePath.trim();
  if (!repoUrl) return null;
  const rel = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${repoUrl}/blob/HEAD/${rel}`;
}
