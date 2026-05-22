# Quickstart: Phase 2 — Persistence

**Feature**: `002-persistence-todos` | **Date**: 2026-05-21

This guide covers setting up the persistence layer from scratch, including Prisma, SQLite, and
the first migration.

## Prerequisites

- Node.js 20+ and npm installed
- Phase 1 implementation complete and running (`npm run dev` shows the three-panel app)

---

## 1. Install Prisma

```bash
npm install prisma @prisma/client
```

---

## 2. Initialize Prisma with SQLite

```bash
npx prisma init --datasource-provider sqlite
```

This creates:
- `prisma/schema.prisma` — edit this with the schema from `data-model.md`
- `.env` — contains `DATABASE_URL="file:./dev.db"` (change to `file:./prisma/dev.db`)

Update `.env`:
```
DATABASE_URL="file:./prisma/dev.db"
```

Make sure `.env` is in `.gitignore` (it should already be — confirm with `cat .gitignore`).

---

## 3. Write the Prisma schema

Replace the contents of `prisma/schema.prisma` with the schema from
[data-model.md](./data-model.md#prisma-schema-prismashemaprisma).

---

## 4. Run the first migration

```bash
npx prisma migrate dev --name init
```

This creates the `prisma/migrations/` directory and the SQLite database file at
`prisma/dev.db`. After this command completes, the database is ready.

---

## 5. Generate the Prisma client

Migration automatically runs `prisma generate`. If you need to regenerate manually:

```bash
npx prisma generate
```

The generated client is at `node_modules/@prisma/client` and provides fully-typed access to
all models.

---

## 6. Run the app

```bash
npm run dev
```

On first load, `GET /api/data` finds an empty database and seeds it with the mock data from
`app/lib/mock-data.ts`. The app then renders the full understanding map as before, but now
all changes survive a page reload.

---

## Verifying persistence

1. Open the app at `http://localhost:3000`
2. Create a new waypoint
3. Reload the page
4. Confirm the waypoint is still present

---

## Inspecting the database

Use Prisma Studio for a visual browser of the database:

```bash
npx prisma studio
```

This opens a web UI at `http://localhost:5555` showing all tables and rows.

---

## Resetting the database

To wipe all data and re-seed:

```bash
npx prisma migrate reset
```

This drops and recreates the database, runs all migrations, and runs any seed scripts. After
reset, on next app load `GET /api/data` will re-seed from mock data automatically.

---

## Adding a migration after schema changes

If the Prisma schema changes (e.g., adding a new field):

```bash
npx prisma migrate dev --name describe_the_change
```

Always commit the generated migration file alongside the schema change.
