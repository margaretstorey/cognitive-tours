import { prisma } from '@/app/lib/db';
import { toWaypoint } from '@/app/lib/db-mappers';
import type { Waypoint } from '@/app/lib/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Waypoint;
    if (!body.id || !body.label || !body.type || !body.position) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const row = await prisma.waypoint.create({
      data: {
        id: body.id,
        label: body.label,
        type: body.type,
        description: body.description ?? null,
        notes: body.notes ?? null,
        filePath: body.filePath ?? null,
        posX: body.position.x,
        posY: body.position.y,
      },
    });
    return Response.json(toWaypoint(row));
  } catch {
    return Response.json({ error: 'Failed to create waypoint' }, { status: 500 });
  }
}
