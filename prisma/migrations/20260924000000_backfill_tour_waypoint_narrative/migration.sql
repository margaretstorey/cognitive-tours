-- Backfill: TourWaypoint.narrative (docent mode) was added to dev.db and
-- production by hand-run SQL, with no migration. This records it so the
-- migration history matches schema.prisma. Databases that already have the
-- column should mark this applied (prisma migrate resolve --applied) rather
-- than run it.
ALTER TABLE "TourWaypoint" ADD COLUMN "narrative" TEXT;
