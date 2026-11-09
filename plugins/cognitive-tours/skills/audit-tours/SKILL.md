---
name: "audit-tours"
description: "Check tours against the current code and map: which recently changed files have no waypoint or no tour, stale or non-bridging stop narratives, redundant edges, possible missing stops and drifting edge labels. Reads the site's /api/data; reports only, never writes to the map. Use when the user asks to check their tours, which tours are stale, or what recent work no tour covers."
user-invocable: true
disable-model-invocation: false
---

# Audit Tours Skill

Purpose: the tour-level counterpart to `/audit-waypoints`. It surfaces
drift between the tours and the code, and gaps in coverage after a
stretch of work. It is read-only with respect to the map: it never
writes waypoints, tours or edges, and never sends anything to the
app. Rewriting a narrative and deciding a tour's shape stay with the
user, who makes every change by hand in the app.

Usage: `/audit-tours`, optionally `since YYYY-MM-DD` and/or
`site <url>`, e.g. `/audit-tours since 2026-10-20`.

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
   with `jq`. It holds `waypoints` (`id`, `label`, `type`,
   `description`, `notes`, `filePath`), `edges` (`source`, `target`,
   `label`) and `tours` (`name`, `description`, `stops` in order, each
   `{waypointId, narrative}`). This is a GET only; never POST, PUT or
   DELETE to the site. Say which site and how many waypoints, edges
   and tours were read.
3. **Since when.** Use the `since` argument if given. Otherwise use the
   date of the newest `backups/backup-*.json` if there is one, or else
   7 days ago. Say which date you chose and why.

## Section A — Coverage (mechanical, one block)

This answers "what did I change that the map doesn't know about yet?"

1. Run `git log --since='<date> 00:00' --name-only --format='%h %s'`
   (the `00:00` matters: a bare date means that day at the current
   time) and collect the changed source, test, script and schema files that
   still exist (skip lockfiles, generated files, data such as
   backups, and docs other than ADRs).
2. For each file, list the waypoints whose `filePath` is that file
   (compare ignoring a leading `./`). Mark it **NO WAYPOINT** when
   there are none.
3. For each of those waypoints, list the tours that include it as a
   stop. Mark it **IN NO TOUR** when there are none.
4. Under each file marked NO WAYPOINT or IN NO TOUR, list the subjects
   of the commits that touched it, as raw material for the user's own
   writing.

Report it all together:

```
Coverage since <date>:
- app/lib/sites.ts → NO WAYPOINT
    faf1086 Back up every site nightly to a private Vercel Blob store
- app/components/TourBar.tsx → [w05] TourBar → tours: Architecture…
```

Don't suggest waypoint text here. Coverage is a list of gaps; filling
them is the user's work (see "When the user asks for a draft" below).

## Section B — Tour drift (judgment, one finding at a time)

Walk each tour's stops in order. Remember: a stop's `narrative` is the
bridge **from that stop to the next one** (shown as "Next up").
Flag only these:

- **Stale bridge.** The narrative names a component, file, panel or UI
  location (e.g. "the amber bar in TourBar") that the current code, or
  the named waypoint's current description, places somewhere else, or
  that no longer exists. Cite the file and line that shows what's true
  now.
- **Bridge that doesn't bridge.** The narrative mostly repeats the
  description of its own stop or of the next stop, rather than saying
  why the reader moves from one to the other.
- **Bridge to the wrong place.** The narrative introduces a waypoint
  that isn't the next stop (the tour was reordered, or a stop was
  removed).
- **Redundant path.** Two edges reach the same waypoint where one is
  implied by the other, e.g. A→contains→C when A→contains→B→contains→C
  exists. Report the edge that looks redundant; deleting it is the
  user's call. This uses labels as written, so drifting labels
  ("implemented in" beside "implemented by") can hide a redundant
  path; Section D lists them.
- **Missing stop (suggestion only).** A waypoint connected by edges to
  two consecutive stops of a tour, but not itself in the tour. Phrase
  it as "consider", never as an error.

Do not flag style, tone or length, and do not flag a tour for being
incomplete in general.

Present the first finding in this format, with nothing else asked or
implied:

```
[<tour name>] stop <N>: <waypoint label>
   Finding: <stale bridge | doesn't bridge | wrong place | redundant path | missing stop>
   Text: "<the narrative or edge, quoted>"
   True now: <what the code or map shows, with file:line>
```

Then stop and wait. When the user comes back ("next", "done, what's
next"), present the next finding in the same format. When there are no
more, say so explicitly ("that's all of them").

## Section C — External links (one line)

List any waypoint whose `filePath` starts with `http://` or `https://`
as "external, not checked". Don't fetch them.

## Section D — Edge labels (one block)

The map's edge vocabulary (source → target): **motivates** (Goal → User
Need), **supported by** (User Need → Feature), **contains** (Feature →
Feature), **implemented by** (Feature → Code Component), **decomposes
into** (Code Component → Code Component), **leads to** (ADR → Code
Component or Feature), **validates** (Test → Feature), **threatens**
(Risk → Feature or ADR). Other labels are allowed; this section only
makes drift visible, so the user can decide.

1. Count every edge label (`jq -r '.edges[].label // "(none)"' | sort |
   uniq -c | sort -rn`).
2. List the labels **not** in the vocabulary, with counts, most used
   first.
3. Pair likely near-duplicates with the vocabulary label they seem to
   mean ("implemented in" ×5 → *implemented by*?; "address by" ×1 →
   "addressed by"?), and flag any label whose direction looks reversed
   from the vocabulary ("implements": Code Component → Feature, the
   reverse of *implemented by*). Name one example edge for each
   (source → target labels).
4. Report it in one block and stop:

   ```
   Edge labels: 31 in use, 8 in the vocabulary, 23 others
   - "implemented in" ×5 → same as "implemented by"? e.g. Tours → Core data types
   - "implements" ×1 → reversed "implemented by"? e.g. TourBar → Tours
   - "renders" ×4, "depends on" ×4, … (no close match: fine if meant)
   ```

Suggestions only. Relabelling an edge is done in the app; never edit
edges yourself.

## When the user asks for a draft

Fact fixes (a name, a count, a path, a stop number) can be given
directly as the corrected text.

New or rewritten **narratives, descriptions and tour descriptions** are
the user's to write: writing them is how they build understanding. If
the user asks for one, first nudge once, briefly, to try it themselves
(e.g. "Try a sentence first: what does the reader need from this stop
to make sense of the next one? I'll react to it"). If they still want
a draft, give one, short, marked as a draft to edit rather than paste.
Never offer drafts unprompted.

## Never

- Write to the map in any way: no POST, PUT or DELETE to the site, no
  edits to the app's database files, no scripts that do either.
- Offer to apply changes. Every change is made by the user in the app.
