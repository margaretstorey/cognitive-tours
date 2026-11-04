import { requireEditPasscode } from '@/app/lib/edit-passcode';
import { prisma } from '@/app/lib/db';
import { Prisma } from '@/app/generated/prisma/client';
import { toWaypoint } from '@/app/lib/db-mappers';
import type { Waypoint } from '@/app/lib/types';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = requireEditPasscode(request);
  if (denied) return denied;
  const { id } = await params;
  try {
    const body = (await request.json()) as Partial<Waypoint>;
    const row = await prisma.waypoint.update({
      where: { id },
      data: {
        ...(body.label !== undefined && { label: body.label }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.notes !== undefined && { notes: body.notes ?? null }),
        ...(body.filePath !== undefined && { filePath: body.filePath || null }),
        ...(body.position !== undefined && { posX: body.position.x, posY: body.position.y }),
      },
    });
    return Response.json(toWaypoint(row));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return Response.json({ error: 'Waypoint not found' }, { status: 404 });
    }
    return Response.json({ error: 'Failed to update waypoint' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = requireEditPasscode(request);
  if (denied) return denied;
  const { id } = await params;
  try {
    await prisma.waypoint.delete({ where: { id } });
    return Response.json({ id });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return Response.json({ error: 'Waypoint not found' }, { status: 404 });
    }
    return Response.json({ error: 'Failed to delete waypoint' }, { status: 500 });
  }
}
