import { prisma } from '@/app/lib/db';
import { toWaypoint, toEdge, toTour } from '@/app/lib/db-mappers';
import { INITIAL_WAYPOINTS, INITIAL_EDGES, INITIAL_TOURS } from '@/app/lib/mock-data';

export async function GET() {
  try {
    const count = await prisma.waypoint.count();
    if (count === 0) {
      for (const w of INITIAL_WAYPOINTS) {
        await prisma.waypoint.create({
          data: {
            id: w.id,
            label: w.label,
            type: w.type,
            description: w.description,
            notes: w.notes ?? null,
            posX: w.position.x,
            posY: w.position.y,
          },
        });
      }
      for (const e of INITIAL_EDGES) {
        await prisma.edge.create({
          data: { id: e.id, source: e.source, target: e.target, label: e.label ?? null },
        });
      }
      for (const t of INITIAL_TOURS) {
        await prisma.tour.create({
          data: {
            id: t.id,
            name: t.name,
            description: t.description,
            waypoints: {
              create: t.stops.map((s, order) => ({
                waypointId: s.waypointId,
                order,
                narrative: s.narrative?.trim() || null,
              })),
            },
          },
        });
      }
    }

    const [waypointRows, edgeRows, tourRows] = await Promise.all([
      prisma.waypoint.findMany(),
      prisma.edge.findMany(),
      prisma.tour.findMany({ include: { waypoints: true } }),
    ]);

    return Response.json({
      waypoints: waypointRows.map(toWaypoint),
      edges: edgeRows.map(toEdge),
      tours: tourRows.map(toTour),
    });
  } catch (err) {
    console.error('Failed to load data:', err);
    return Response.json({ error: 'Failed to load data', detail: String(err) }, { status: 500 });
  }
}
