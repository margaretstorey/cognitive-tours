import type { PrismaClient } from '@/app/generated/prisma/client';
import type { Tour, Waypoint, WaypointEdge } from '@/app/lib/types';
import demoCanonical from '@/backups/demo-canonical.json';
import demoFlask from '@/backups/demo-flask.json';

/**
 * The nightly reset of a demo site (route.ts beside this file).
 *
 * It deletes the whole map, so it runs only when a site has opted in AND is
 * named as a demo: a slip in one setting on a team site or the owner's own
 * site can't wipe a real map.
 *   RESET_NIGHTLY_FROM        demo-canonical | demo-flask | empty
 *   NEXT_PUBLIC_PROJECT_NAME  must contain the word "demo" (any case)
 * The copies are the committed reset files in backups/, bundled at build
 * time, so refreshing one of those files changes what the next reset puts
 * back (after a deploy).
 */
export interface SiteData {
  waypoints: Waypoint[];
  edges: WaypointEdge[];
  tours: Tour[];
}

const SOURCES: Record<string, SiteData> = {
  'demo-canonical': demoCanonical as unknown as SiteData,
  'demo-flask': demoFlask as unknown as SiteData,
  empty: { waypoints: [], edges: [], tours: [] },
};

export type ResetPlan = { source: string; data: SiteData } | { skip: string };

export function resetPlan(env: Record<string, string | undefined>): ResetPlan {
  const from = env.RESET_NIGHTLY_FROM?.trim();
  if (!from) return { skip: 'RESET_NIGHTLY_FROM is not set' };
  const data = SOURCES[from];
  if (!data) return { skip: `RESET_NIGHTLY_FROM "${from}" is not one of ${Object.keys(SOURCES).join(', ')}` };
  const project = env.NEXT_PUBLIC_PROJECT_NAME?.trim() ?? '';
  if (!/\bdemo\b/i.test(project)) return { skip: `project "${project}" is not a demo site` };
  return { source: from, data };
}

const date = (value: string | undefined): Date | undefined => (value ? new Date(value) : undefined);

/** Replace the whole map with `data`, in one transaction (all or nothing). */
export async function applyReset(prisma: PrismaClient, data: SiteData): Promise<void> {
  await prisma.$transaction([
    prisma.tourWaypoint.deleteMany(),
    prisma.tour.deleteMany(),
    prisma.edge.deleteMany(),
    prisma.waypoint.deleteMany(),
    prisma.waypoint.createMany({
      data: data.waypoints.map(w => ({
        id: w.id,
        label: w.label,
        type: w.type,
        description: w.description ?? null,
        notes: w.notes ?? null,
        filePath: w.filePath ?? null,
        posX: w.position.x,
        posY: w.position.y,
      })),
    }),
    prisma.edge.createMany({
      data: data.edges.map(e => ({ id: e.id, source: e.source, target: e.target, label: e.label ?? null })),
    }),
    ...data.tours.map(t =>
      prisma.tour.create({
        data: {
          id: t.id,
          name: t.name,
          description: t.description ?? '',
          author: t.author?.trim() || null,
          createdAt: date(t.createdAt),
          updatedAt: date(t.updatedAt),
          waypoints: {
            create: t.stops.map((s, order) => ({ waypointId: s.waypointId, order, narrative: s.narrative?.trim() || null })),
          },
        },
      })
    ),
  ]);
}
