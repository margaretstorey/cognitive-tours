import { requireEditPasscode } from '@/app/lib/edit-passcode';
import { prisma } from '@/app/lib/db';
import { Prisma } from '@/app/generated/prisma/client';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = requireEditPasscode(request);
  if (denied) return denied;
  const { id } = await params;
  try {
    await prisma.edge.delete({ where: { id } });
    return Response.json({ id });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return Response.json({ error: 'Edge not found' }, { status: 404 });
    }
    return Response.json({ error: 'Failed to delete edge' }, { status: 500 });
  }
}
