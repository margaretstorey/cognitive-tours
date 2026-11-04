# ADR 008: One Site and Database per Team

**Status:** Accepted (stopgap; defers ADR 007)  
**Date:** 2026-10-20 (decided); written up 2026-11-03  
**Related:** ADR 007 (One Database with Team-Scoped Rows), spec 009 (`specs/009-multi-user-support/spec.md`), issue #10, ADR 003 (Use Turso), ADR 004 (Deploy to Vercel), `docs/RESTORE.md`  
**Author:** Margaret-Anne Storey (decision), Claude (write-up)

---

## Context

ADR 007 (Sep 24) chose one shared database with a team-space identifier on
every row, and rejected a separate database per team. That design needs a
schema change, a team-scoped data-access layer and a cross-team isolation
test before any team can use the app.

Startup Studio teams needed sites for the Oct 23 class. None of the ADR 007
work had been built.

---

## Decision

Give **each team its own Vercel project and its own Turso database**, all
deploying from this repo's `main`. The code has no notion of a team: no team
id, no login, no filtering. A team's data is separate because it is in a
different database.

Only environment variables differ between sites (see the Team sites table in
`CLAUDE.md`):

- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`: which database the site uses;
- `SEED_ON_EMPTY=false`: a new team starts with an empty map instead of the
  self-documentation seed (`app/api/data/route.ts`, commit 46f4f82);
- `NEXT_PUBLIC_PROJECT_NAME`: the "Project:" label (commit a0d73f3);
- `NEXT_PUBLIC_REPO_URL` (optional): file links open the team's GitHub repo
  (commit 7db0dd8).

**Why:** mostly time, and also ease of deployment. It needed no schema change
and no team code (46f4f82 changed five lines of application code), so the
sites could be ready for the course. It is meant to be temporary: the
intended direction is still ADR 007's single database with team-scoped rows
(now Deferred). Until one of the triggers below arrives, one site each is
enough; as of Nov 3, perhaps 2 or 3 outside users are expected, and each can
be given a site (or use the demo).

---

## Consequences

**Positive:**
- **ADR 007's main risk can't happen.** No query can forget a team filter,
  because no tables are shared.
- **One site can be restored without touching the others**
  (`scripts/restore-production-from-backup.ts`, `docs/RESTORE.md`).
- Adding a site is configuration, not code: a database, a token, a Vercel
  project and its name in the `SITE_NAMES` setting, read by `getSites()`
  in `app/lib/sites.ts`. (Since Nov 4 the names are kept out of the repo,
  because each name gives a site's address and the sites have no login.)

**Negative** (the costs ADR 007 predicted when it rejected this option):
- **Schema changes multiply.** Every migration has to run on every database
  (the loop in `CLAUDE.md`, "Applying a schema migration to production"),
  before the push.
- **Backups multiply.** One per site, by `scripts/backup-all-sites.ts` and
  the nightly backup (`app/api/backup-nightly/route.ts`).
- **No instructor overview.** Spec 009's cross-team view (SC-007) isn't
  built, and would need one connection per database.
- **Every push builds every site**, nine as of Nov 3.
- **Anyone with a site's link can read and edit everything.** No login was
  added. Spec 009 accepted that for teams by class norm; it doesn't fit
  public or industry users.

---

## Alternatives Considered

- **ADR 007, one database with team-scoped rows**: not chosen for the
  launch, for lack of time to build and test the scoping safely. Deferred,
  not abandoned.
- **Separate tables per team**: still rejected, for ADR 007's reasons.

---

## Revisit If

- People outside the course (public or industry users) need their own
  space to build their own tours, in numbers that one site each can't
  handle; that needs accounts rather than a site per person.
- An instructor overview across teams is needed.
- The number of sites makes migrations, backups or builds a burden.
- An approved research protocol (spec 009 FR-020 and FR-026) needs research
  data stored in a particular way.
