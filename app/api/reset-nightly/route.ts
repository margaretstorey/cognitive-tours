import { prisma } from '@/app/lib/db';
import { applyReset, resetPlan } from './reset';

/**
 * Nightly reset of a demo site, triggered by the cron in vercel.json at
 * 08:00 UTC (midnight Pacific in winter, 1 a.m. in summer).
 *
 * Every Vercel project builds from this repo, so every project gets the cron.
 * It does nothing (204) unless the site opted in with RESET_NIGHTLY_FROM and
 * is named as a demo (see reset.ts); team sites and the owner's own site are
 * never reset. Vercel sends `Authorization: Bearer $CRON_SECRET` on cron
 * calls, so nobody else can trigger it.
 */
export async function GET(request: Request) {
  const plan = resetPlan(process.env);
  if ('skip' in plan) return new Response(null, { status: 204 });

  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const date = new Date().toISOString().slice(0, 10);
  const counts = { waypoints: plan.data.waypoints.length, edges: plan.data.edges.length, tours: plan.data.tours.length };
  try {
    await applyReset(prisma, plan.data);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ nightlyReset: date, from: plan.source, error }));
    return Response.json({ date, from: plan.source, error }, { status: 500 });
  }
  // Shows in the Vercel logs for the cron run.
  console.log(JSON.stringify({ nightlyReset: date, from: plan.source, ...counts }));
  return Response.json({ date, from: plan.source, ...counts });
}
