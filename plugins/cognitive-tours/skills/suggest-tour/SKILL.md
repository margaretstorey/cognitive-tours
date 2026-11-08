---
name: "suggest-tour"
description: "Help the user fit recent waypoints into tours: suggest stops to add to existing tours or a new tour with a starting order, ask what the tour is for, then make the change one tour at a time after the user approves, and leave the tour description and stop narratives for the user to write in the app, with help if asked. Use when the user asks to add something to a tour, make a new tour of part of the map, or where new waypoints fit in their tours."
user-invocable: true
disable-model-invocation: false
---

# Suggest Tour Skill

Purpose: help the user keep tours in step with the map after new work,
usually right after `/suggest-waypoint`. The skill suggests structure
(which tour, which stops, what order) and, once the user approves,
makes that change: it creates the tour or adds the stops, one tour at a
time. The user decides the tour's shape and writes the understanding:
the tour description and every narrative, in the app. The skill helps
with those only when asked.

Usage: `/suggest-tour`, optionally `since YYYY-MM-DD` and/or
`site <url>`.

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
2. **Read the map, fresh.** Fetch `<site>/api/data` with a plain GET
   (`curl -sS <site>/api/data`) into a scratch file, even if it was
   read earlier in the conversation: the user may have just added
   waypoints. It holds `waypoints`, `edges` (`source`, `target`,
   `label`) and `tours` (`name`, `description`, `stops` in order, each
   `{waypointId, narrative}`). Nothing is written until step 3, and then
only what the user approved.
3. **Since when.** Use the `since` argument if given. Otherwise use the
   date of the newest `backups/backup-*.json` if there is one, or else
   today. Use `git log --since='<date> 00:00'` (the `00:00` matters: a bare date means that day at the current time) (and `.bram/worklist-history/`, or `resources/worklist-history/`
   in older Bram projects, if present) to know which waypoints relate to recent work: those
   whose `filePath` changed, plus any waypoints the user just created
   in this conversation.

## 1. Suggestions, as a short list

- **Existing tours that should change:**
  - a recent waypoint linked by edges to two consecutive stops of a
    tour: suggest inserting it between them;
  - a stop whose waypoint changed a lot since the date: its narrative
    and the next stop's may need a look (point to `/audit-tours`).
- **Whether a new tour is warranted:** several recent waypoints linked
  to each other (or to the same existing waypoint) that no tour covers.
  Suggest a working name and a stop **order** built from the edges
  (e.g. decision → feature → code → test), as a starting point only.

Keep it to the few that matter, and **show them high level: one line
per tour**, naming it, with how many stops would be added and why. No
stop lists yet; those come in step 2, for the one tour picked. For
example:

```
1. Architecture (add 2 stops): the skills plugin and its panel
2. New tour, "Skills" (about 5 stops): no tour covers this yet
```

Then ask which **one** to work on (or none), and wait. Work on only that
tour, through step 4.

## 2. The plan for one tour

One tour at a time.

1. Ask what the tour is **for** and who will read it (e.g. "a student
   joining a team site", "me in three months"). One message, then
   wait.
2. Show the plan:
   - **A new tour:** a working name and the stops in order, by label.
   - **An existing tour:** its name, in bold, as the plan's first line,
     then its current stops in order, with the new ones
     marked where they'd go (`+ 4. Team sites`). Any move or removal of
     an existing stop is listed separately and happens only if the user
     asks for it.
3. End with: "**Nothing has changed yet.** Reply **go ahead** to make
   this change to the tour, or tell me what to change. Or make it
   yourself in **Edit tour** (or **+ New Tour**): the more you do by
   hand, the more of it you'll remember." Offer the manual route every
   time, in that one line; never press it. Then wait, and adjust until
   the user says go ahead. The shape is theirs.
4. **If the user makes it by hand:** the plan is their checklist. Skip
   step 3, go straight to step 4's writing prompts, and on **check**
   also confirm the stops and order match the plan.

## 3. Make the change

Only after the user's OK. Build each request body in a scratch file
with `jq`; send it with `curl -sS -X POST` (or `-X PUT`) `-H
'Content-Type: application/json' --data @<file> <site>/api/<route>`.

- **A new tour** → `POST /api/tours`:
  `{id, name, description: "", stops: [{waypointId, narrative: null}]}`,
  with id `t-<ms>-<6 random a–z0–9>`. Leave `author` out: the tour is
  the user's.
- **An existing tour** → `PUT /api/tours/<id>` with `{stops}` only.
  **This replaces the tour's whole stop list**, so:
  - re-read `/api/data` just before, and build `stops` from the tour's
    current stops, in order, **copying every existing `narrative`
    exactly**, with the new stops inserted (`narrative: null`);
  - send nothing else (no name or description), so those are untouched;
  - afterwards, re-read and check that every earlier stop is still there
    with the same narrative. If one isn't, say so at once and give the
    old narrative text from your earlier read, so the user can put it
    back.
- **A narrative that leads into a new stop has changed meaning:** if a
  stop is inserted after stop N, stop N's narrative now leads into the
  new stop, not the old next one. Don't change it; tell the user.

**If a request returns 401**, the site has an edit passcode. Ask the
user for it, and send it in the `x-edit-passcode` header. Keep it out of
files you leave behind: delete the scratch files at the end, and never
echo it back. **Stop at the first failure** and report what happened.

## 4. Hand over the writing

The tour description and the narratives are where the understanding
goes, so they're the user's. First say exactly what changed, **always
naming the tour**: "Added stops 4 and 7 (*Team sites*, *Skills plugin*)
to the tour **Architecture**" or "Created the tour **Skills** with 5
stops". Never just "the tour has changed". Then, briefly:

> Open the map (refresh it if it was open), pick **<tour name>** from
> the tour menu, and click **Edit tour**. Write:
> - the **tour description** (new tour): what it's for and who it's for;
> - the narrative for stops <N, M, …> (each new stop, and any stop
>   before one): each box is headed "→ to stop N+1: <label>". Why does
>   the reader go from this stop to the next?
>
> Reply **check** when you've written them and I'll read them back.

A stop's narrative is the bridge **from that stop to the next one**
(shown as "Next up"). The last stop's narrative can close the tour or
point to another tour.

**More help, only when asked:**

- **"check"**: re-read `/api/data` and react to each one, briefly: does
  it lead into the next stop, or just repeat its own waypoint's
  description? Anything factually off (cite file:line)? Don't rewrite
  it.
- **Writing in chat**: if the user gives a narrative or description
  here, show it in place and, on their OK, save it: a description with
  `PUT /api/tours/<id>` `{description}`; a narrative with the full
  `{stops}` list as above, changing only that stop's `narrative`.
- **Asking you to write one**: nudge once, briefly, to try first ("Try
  one sentence: what does the reader need from this stop to make sense
  of the next? I'll react to it"). If they still want it, show a short
  draft and save it only on their OK. Then add a provenance line at the
  end of the tour description (tours have no Notes field), naming
  yourself (Claude or Codex), which stops, and the date:
  `Stop narratives 2 and 4 drafted with Claude's help, Nov 3.` Ask the
  user to add their own line when they rewrite one. Text the user wrote
  needs no marker.

Then wait. When the user is done with this tour, show what's left of
the list from step 1, one line each, and let them pick the next (or
stop). When none are left, say so.

## Never

- Write anything the user hasn't seen and approved, in this
  conversation, for this tour.
- Remove, reorder or rename a stop, or delete a tour, unless the user
  asked for exactly that.
- Change a narrative or description the user wrote without their OK, or
  draft one they didn't ask for.
- Edit the app's database files directly, or the user's repo.
- Write a passcode anywhere, or a site address into a tracked file.
