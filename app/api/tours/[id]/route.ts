import { prisma } from '@/app/lib/db';
import { Prisma } from '@/app/generated/prisma/client';
import { toTour } from '@/app/lib/db-mappers';
import type { Tour } from '@/app/lib/types';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = (await request.json()) as Partial<Tour>;
    const row = await prisma.$transaction(async (tx) => {
      if (body.waypointIds !== undefined) {
        await tx.tourWaypoint.deleteMany({ where: { tourId: id } });
        await tx.tourWaypoint.createMany({
          data: body.waypointIds.map((waypointId, order) => ({ tourId: id, waypointId, order })),
        });
      }
      return tx.tour.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.description !== undefined && { description: body.description }),
        },
        include: { waypoints: true },
      });
    });
    return Response.json(toTour(row));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return Response.json({ error: 'Tour not found' }, { status: 404 });
    }
    return Response.json({ error: 'Failed to update tour' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await prisma.tour.delete({ where: { id } });
    return Response.json({ id });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return Response.json({ error: 'Tour not found' }, { status: 404 });
    }
    return Response.json({ error: 'Failed to delete tour' }, { status: 500 });
  }
}
