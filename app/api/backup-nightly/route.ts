import { put } from '@vercel/blob';
import { getSites, siteUrl, isSiteBackup } from '@/app/lib/sites';

/**
 * Nightly backup of every site, triggered by the cron in vercel.json.
 *
 * Every Vercel project builds from this repo, so every project gets the cron.
 * Only the user's own project sets BACKUP_ALL_SITES=true; everywhere else
 * this is a no-op. Vercel sends `Authorization: Bearer $CRON_SECRET` on cron
 * calls, so nobody else can trigger it.
 *
 * Each site's /api/data (GET only) is saved to the private Blob store at
 * nightly/YYYY-MM-DD/<name>.json ("mine" for the user's own site).
 */
export async function GET(request: Request) {
  if (process.env.BACKUP_ALL_SITES !== 'true') {
    return new Response(null, { status: 204 });
  }
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const date = new Date().toISOString().slice(0, 10);
  const saved: { site: string; waypoints: number; edges: number; tours: number }[] = [];
  const failed: { site: string; error: string }[] = [];

  // SITE_NAMES (and MY_SITE_URL) are set on the cognitive-tours project only.
  let SITES: (string | null)[];
  try {
    SITES = getSites();
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ nightlyBackup: date, error }));
    return Response.json({ date, error }, { status: 500 });
  }

  // One failing site doesn't stop the rest.
  for (const name of SITES) {
    const site = name ?? 'mine';
    try {
      const res = await fetch(`${siteUrl(name)}/api/data`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: unknown = await res.json();
      if (!isSiteBackup(data)) throw new Error('response is not { waypoints, edges, tours }');

      await put(`nightly/${date}/${site}.json`, JSON.stringify(data), {
        access: 'private',
        contentType: 'application/json',
        // A manual re-run the same day replaces that day's copy.
        allowOverwrite: true,
      });
      saved.push({ site, waypoints: data.waypoints.length, edges: data.edges.length, tours: data.tours.length });
    } catch (err) {
      failed.push({ site, error: err instanceof Error ? err.message : String(err) });
    }
  }

  // Shows in the Vercel logs for the cron run.
  console.log(JSON.stringify({ nightlyBackup: date, saved, failed }));
  return Response.json({ date, saved, failed }, { status: failed.length > 0 ? 500 : 200 });
}
