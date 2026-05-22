import { PrismaClient } from '../generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set');
  // Strip the "file:" prefix that Prisma/SQLite URLs use — better-sqlite3 takes a plain file path.
  const filePath = url.replace(/^file:/, '');
  const adapter = new PrismaBetterSqlite3({ url: filePath });
  return new PrismaClient({ adapter });
}

// Global cache prevents multiple client instances during Next.js hot-reload in dev.
const globalForPrisma = global as unknown as { prisma: ReturnType<typeof createPrismaClient> };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
