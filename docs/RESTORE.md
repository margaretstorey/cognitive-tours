# If something goes wrong

What to do when a Cognitive Tours map has been damaged: waypoints deleted,
tours wiped, junk added, or a whole site emptied. Follow the steps in order.
If anything is unclear, ask Claude in this repo ("help me restore a team's site")
and go through it together.

## 1. First: don't panic, and back up what's there now

Nothing is lost yet. Every site is saved **every night** to Vercel, and
**every time you run the backup command**. Before changing anything, save
the current state too, so even a mistaken restore can be undone:

```
npx tsx scripts/backup-all-sites.ts
```

It's read-only: it only reads each site and saves a file. Yours goes to
`backups/backup-<date>.json`, everyone else's to
`backups/teams/<site>-<date>.json`.

## 2. Is it the code or the data?

- **Every site broke at once, right after a push** (a blank or error page):
  that's the code, and the maps are probably fine. Go to Vercel → the
  project → **Deployments**, find the last good deployment and click
  **Instant Rollback**. Stop here.
- **One map is missing things or has wrong things on it:** that's the data.
  Carry on below.

## 3. Reset the demo site

The demo has a fixed good copy, `backups/demo-canonical.json` (committed),
so resetting it always puts back the same map.

**Usually you don't need to:** since Nov 4 the demo site resets itself
every night around midnight Pacific (`/api/reset-nightly`; see `CLAUDE.md`
→ Team sites), back to `backups/demo-canonical.json`. Use the steps below
only to reset it straight away. The other demo sites (demo-flask and the
blank ones) don't reset themselves; reset one the same way, with its own
backup (demo-flask: `backups/demo-flask.json`) or an empty one.

1. Sign in to Turso if you haven't today: `turso auth login`, with the
   **mastorey@gmail.com** account. The browser window may stay blank;
   the terminal says "Logged in" when it's done.
2. Make the restore file. It changes nothing yet:
   ```
   npx tsx scripts/restore-production-from-backup.ts backups/demo-canonical.json demo
   ```
3. Run it:
   ```
   turso db shell ct-demo < backups/restore/demo-from-demo-canonical.sql
   ```
4. **Reload** https://cognitive-tours-demo.vercel.app, and any other tab
   that has it open. An old tab still shows the damaged map, and saving
   from it could put deleted things back.

## 4. Restore a student site (for example a team called Acme)

There's no fixed good copy for a team, because their map keeps growing.
You put back a backup from **before** the damage, and **anything the team
added after that backup is lost.**

1. **Tell the team first**, and ask them to stop editing until you're done.
2. **Choose the backup:** the most recent one from before the damage.
   - On your Mac: `ls backups/teams/acme-*` (a date per file; `b`, `c`
     are later the same day).
   - Or a nightly one (see 6).
3. Make the restore file. It prints what it will put back, plus the exact
   command for the next step:
   ```
   npx tsx scripts/restore-production-from-backup.ts backups/teams/acme-<date>.json acme
   ```
   Check the counts and tour names it lists. They should look like the
   team's map before the damage.
4. Sign in to Turso if needed (`turso auth login`), then run the command
   it printed:
   ```
   turso db shell ct-acme < backups/restore/acme-from-acme-<date>.sql
   ```
5. Reload the team's site and check it with them.

## 5. Restore your own map

The same as a student site, with the site name `mine`, the database
`cognitive-tours`, and your backups in `backups/backup-<date>.json`:

```
npx tsx scripts/restore-production-from-backup.ts backups/backup-<date>.json mine
turso db shell cognitive-tours < backups/restore/mine-from-backup-<date>.sql
```

## 6. Using a nightly backup

Use this when the damage happened before your last manual backup, or when
you don't have one.

1. On Vercel, go to your **team's** page, not a project's (storage stores
   belong to the team) → **Storage** in the left sidebar →
   **cognitive-tours-backups** → **Browser** → `nightly/<date>/<site>.json`
   (`mine.json` is yours).
2. Download it into `backups/teams/` (or `backups/` for yours), and rename
   it to `<site>-<date>-nightly.json` so it's clear what it is.
3. Follow 4 or 5 with that file.

*Not tried yet (Nov 3). Ask Claude to go through it with you the first
time.*

## 7. If a restore stops with an error

**Nothing changed.** A restore either happens completely or not at all;
this was checked on Turso on Nov 3. Read the error message, then either
run the same command again or ask Claude.

The restore script itself refuses a backup that looks broken (for
example, a tour stop pointing at a waypoint that isn't in the backup) and
lists what's wrong. If that happens, pick a different backup.

## 8. Site names and databases

| Site | Name for the script | Turso database | Address |
|---|---|---|---|
| Your own map | `mine` | `cognitive-tours` | the `MY_SITE_URL` line in `.env` |
| Demo | `demo` | `ct-demo` | cognitive-tours-demo.vercel.app |
| A team site | its name (e.g. `acme`) | `ct-<name>` (e.g. `ct-acme`) | cognitive-tours-<name>.vercel.app |

The full list of team sites is kept out of the repo (anyone with a
team's address can edit its map): it's in `CLAUDE.local.md` on your Mac,
and the names are the `SITE_NAMES` line in `.env`. How a team is added is
in `CLAUDE.md` → Team sites.

## 9. What was tested, and when

On **Nov 3, 2026**:

- **Seven practice restores on a copy of the local database:** the demo,
  your map, the test site, three student team sites and an old July backup. Each was
  read back through the app and was identical to its backup, including
  positions, tour order, narratives and dates.
- **All 39 backups on disk** passed the script's checks.
- **On a temporary Turso database,** a restore made to fail halfway
  changed nothing, and `turso db shell` reported the failure (exit code 1).
  The database was then deleted.
- **On the real demo site,** a deliberately messed-up map (one waypoint
  moved, one deleted, a junk one added) was restored, and the live site
  then matched `backups/demo-canonical.json` exactly.

Not yet tried: restoring a student site or your own map for real, and
using a nightly backup.
