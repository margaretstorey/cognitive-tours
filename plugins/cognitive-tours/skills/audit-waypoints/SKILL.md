---
name: "audit-waypoints"
description: "Check Code Component, ADR, and Test waypoint descriptions against the actual current contents of their linked files, and check that every waypoint's file path still exists; report factual drift and broken paths as a list of manual edits — never writes to the waypoint data itself. Use when the user asks to check their waypoints, whether the map is out of date with the code, or which waypoint descriptions are wrong."
user-invocable: true
disable-model-invocation: false
---

# Audit Waypoints Skill

Purpose: check Code Component, ADR, and Test waypoint descriptions
against the actual current contents of their linked files, and flag
factual drift; and check that every waypoint's file path, of any type,
still exists. This skill is read-only with respect to waypoint data:
it reads the map from the site's `/api/data` and never writes to it or
edits anything on the user's behalf. All corrections are applied by
the user, by hand, through the app's own Edit Waypoint UI.

Usage: `/audit-waypoints`, optionally `site <url>`.

## Setup

1. **Which site.** The map lives on a website, not in the repo, so
   this is the one thing the repo can't tell you. In order:
   - the `site <url>` argument, if given;
   - else a line `Cognitive Tours site: <url>` in the repo's
     `CLAUDE.local.md` or `CLAUDE.md`
     (`grep -h '^Cognitive Tours site:' CLAUDE.local.md CLAUDE.md 2>/dev/null | head -1`);
   - else ask for the site's address and wait. Once given, offer to
     remember it for this repo by adding that line to
     `CLAUDE.local.md`, but only if git ignores that file
     (`git check-ignore -q CLAUDE.local.md`). If it doesn't, offer to
     add `CLAUDE.local.md` to `.gitignore` first. Save nothing without
     a yes.

   Say which site you're using and where the address came from. Never
   write the address anywhere else (a tracked file, a commit, an
   issue): a site has no login, so its address is the key to editing
   its map.
2. **Read the map.** Fetch `<site>/api/data` with a plain GET
   (`curl -sS <site>/api/data`) into a scratch file and work from it
   with `jq`. Its `waypoints` each have `id`, `label`, `type`,
   `description`, `notes` and `filePath`. Say which site was read and
   how many waypoints it has.

## Procedure

**Why only these three types are checked for drift:** Code Component,
ADR and Test are the types whose descriptions make claims about a
file's contents (what the code does, what a decision names, what a test
checks). Goal, User Need, Risk, Open Question and AI Instruction
usually describe intent, which has nothing in a file to be checked
against, and a Feature has no one canonical file (see below). Every
type's file *path* is still checked, in the next section.

1. From that JSON, take all waypoints of type "Code Component", "ADR",
   or "Test" that have a non-empty filePath.
   A filePath starting with `http://` or `https://` is an external
   link: don't read or flag it; list it once at the end as
   "external, not checked".
2. For each one, read the actual file at that path.
3. Compare the waypoint's description and notes against the file's
   current contents. Flag only concrete, verifiable claims that have
   become false — counts (e.g. "8 types" when there are now 10),
   function/type/component names that changed or were removed, file
   paths that moved, "this is the only place X happens" claims that are
   no longer true.
   - **Code Component**: as above — description should match current
     code.
   - **ADR**: an ADR is a historical record of a decision, not living
     documentation — do NOT flag an ADR just because the code has since
     evolved past it or been superseded (a waypoint like "Status:
     Superseded by Phase 2" is doing its job correctly, not drifting).
     Only flag concrete pointer errors: a filePath that no longer
     exists or was renamed, or a component/function name the ADR
     references by name that no longer exists under that name.
   - **Test**: check the waypoint's claims against the actual test
     file's current assertions/steps — e.g. "verifies all 6 steps" when
     the test now checks a different number, a described scenario or
     selector that no longer appears in the test, or a filePath that no
     longer matches an existing test file.
4. Do NOT flag subjective or interpretive language ("this is the brain
   of the app", "simple, read-focused") — only factual claims.
5. For each flagged waypoint, report:
   - Waypoint label and id
   - The outdated claim (quote it)
   - What's actually true now, with a specific reference to the file/line
   - The exact corrected field value(s), ready to paste
6. Present flagged waypoints one at a time, not as a batch list. For
   the first one, report it in this format, with nothing else asked or
   implied:

   ```
   [id] label
      Field: <field name>
      Change to: <exact new value>
   ```

   Then stop and wait — do not print the next flagged waypoint yet.
7. When the user comes back (e.g. "next", "ok done, what's next",
   "back to do wNN"), present the next flagged waypoint in the same
   format. Repeat until all flagged waypoints have been presented, then
   say so explicitly ("that's all of them").
8. Do not ask which ones to update, and do not offer to apply any of
   them yourself. This skill never edits waypoints — local or
   production. Each fix is applied by the user, by hand, in the app's
   own Edit Waypoint form, at whatever pace they choose.

## File path check, every type (separate from the drift audit above)

Any waypoint can point at a file, and a path that no longer exists
breaks the link whatever the type (an Open Question pointing at a
deleted note, a Goal pointing at a moved doc). Features also get only
this check: they don't have one canonical implementation file the way
Code Components do, so there's nothing reliable to diff a Feature's
description against. This check is purely mechanical: does the
referenced file exist, yes or no. It is not a judgment about whether
the description is still accurate, and it runs and reports
independently of the numbered, one-at-a-time drift findings above.

1. Take **every** waypoint with a non-empty filePath, of any type.
   Skip external links (`http://` or `https://`); they're listed at the
   end as "external, not checked".
2. For each one, check whether the file exists on disk (compare
   ignoring a leading `./`). Do not read or evaluate the file's
   contents — existence only.
3. For each missing file, ask git what happened to it:
   `git log --diff-filter=DR -1 --format='%h %ad %s' --date=short -- <path>`
   gives the commit that deleted or renamed it, if any; for a rename,
   `git log --diff-filter=R -1 --name-status --format= -- <path>` shows
   the new path.
4. Report them together in one block, grouped by type (not one at a
   time, and not mixed into the drift-audit list). List the missing
   ones in full and only count the rest:

   ```
   File path check (every type): 41 OK, 2 missing, 3 external
   - [Open Question] <id> "<label>" → <path> → MISSING (deleted in 73d0eed, 2026-06-26: "delete some old files…")
   - [Code Component] <id> "<label>" → <path> → MISSING (renamed in <hash>; now <new path>?)
   ```

   Waypoints with no filePath aren't listed: many types have none, on
   purpose.
5. As with the rest of this skill: report only. Never write to the
   waypoint data, and never offer to create the missing file or edit
   the waypoint. The fix (a new path, or clearing it) is the user's, in
   the app.

## Never

- Write to the map in any way: no POST, PUT or DELETE to the site, no
  edits to the app's database files, no scripts that do either.
