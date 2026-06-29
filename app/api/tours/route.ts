import { prisma } from '@/app/lib/db';
import { toTour } from '@/app/lib/db-mappers';
import type { Tour } from '@/app/lib/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Tour;
    if (!body.id || !body.name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const row = await prisma.tour.create({
      data: {
        id: body.id,
        name: body.name,
        description: body.description ?? '',
        waypoints: {
          create: (body.stops ?? []).map((s, order) => ({
            waypointId: s.waypointId,
            order,
            narrative: s.narrative?.trim() || null,
          })),
        },
      },
      include: { waypoints: true },
    });
    return Response.json(toTour(row));
  } catch {
    return Response.json({ error: 'Failed to create tour' }, { status: 500 });
  }
}
