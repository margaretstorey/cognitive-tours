/**
 * The project this deployment's map belongs to, e.g. "Finito" on a team site.
 * Set per Vercel project via NEXT_PUBLIC_PROJECT_NAME (inlined at build time);
 * null on the instructor's own site, in local dev and in tests.
 */
export const PROJECT_NAME: string | null = process.env.NEXT_PUBLIC_PROJECT_NAME?.trim() || null;
