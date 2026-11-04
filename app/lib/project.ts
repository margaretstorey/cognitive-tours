/**
 * The project this deployment's map belongs to, e.g. "Acme" on a team site.
 * Set per Vercel project via NEXT_PUBLIC_PROJECT_NAME (inlined at build time);
 * null on the instructor's own site, in local dev and in tests.
 */
export const PROJECT_NAME: string | null = process.env.NEXT_PUBLIC_PROJECT_NAME?.trim() || null;

/**
 * An optional notice shown under the header title, so a visitor can tell at
 * once what kind of site this is (e.g. "Demonstration site … changes may be
 * lost."). Plain text, whitespace collapsed, at most 300 characters.
 */
export function parseSiteNotice(raw: string | undefined): string | null {
  const text = raw?.replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, 300) : null;
}

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * An optional header background colour, as a CSS hex value such as #7f1d1d.
 * Anything else is ignored (the header stays black), so a typo can't break
 * the page. Header text stays white, so use a dark colour.
 */
export function parseSiteColor(raw: string | undefined): string | null {
  const value = raw?.trim();
  return value && HEX_COLOR.test(value) ? value : null;
}

// Each set per Vercel project and inlined at build time; unset everywhere by default.
export const SITE_NOTICE: string | null = parseSiteNotice(process.env.NEXT_PUBLIC_SITE_NOTICE);
export const SITE_COLOR: string | null = parseSiteColor(process.env.NEXT_PUBLIC_SITE_COLOR);
