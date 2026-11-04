import { requireEditPasscode } from '@/app/lib/edit-passcode';
import { prisma } from '@/app/lib/db';
import { toEdge } from '@/app/lib/db-mappers';
import type { WaypointEdge } from '@/app/lib/types';

export async function POST(request: Request) {
  const denied = requireEditPasscode(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as WaypointEdge;
    if (!body.id || !body.source || !body.target) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const row = await prisma.edge.create({
      data: {
        id: body.id,
        source: body.source,
        target: body.target,
        label: body.label ?? null,
      },
    });
    return Response.json(toEdge(row));
  } catch {
    return Response.json({ error: 'Failed to create edge' }, { status: 500 });
  }
}
