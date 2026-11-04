/**
 * An optional passcode for edits (Nov 4). When a site's server-only
 * EDIT_PASSCODE is set, every POST, PUT and DELETE under /api must carry it in
 * the x-edit-passcode header; reading (GET /api/data) stays open, so backups,
 * the nightly jobs and the read-only skills are unaffected. Unset (the
 * default), nothing changes.
 *
 * Set only on the owner's own site for now. A shared secret, not an account:
 * it protects edits, not reading.
 */
export const EDIT_PASSCODE_HEADER = 'x-edit-passcode';

/** Compares without stopping at the first difference, so timing leaks nothing. */
function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function editAllowed(expected: string | undefined, given: string | null): boolean {
  const want = expected?.trim();
  if (!want) return true;
  return given !== null && sameText(want, given.trim());
}

/** null when the edit may go ahead; otherwise the 401 to return. */
export function requireEditPasscode(request: Request): Response | null {
  if (editAllowed(process.env.EDIT_PASSCODE, request.headers.get(EDIT_PASSCODE_HEADER))) return null;
  return Response.json({ error: 'This map needs a passcode to edit' }, { status: 401 });
}
