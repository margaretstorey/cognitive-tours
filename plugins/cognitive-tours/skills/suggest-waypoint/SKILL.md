---
name: "suggest-waypoint"
description: "Help the user record recent work as waypoints: find what's worth explaining later (decisions first), add them to the map in small related batches after the user approves (label, type, file path, links, placed beside related waypoints), and leave the descriptions for the user to write in the app, with help if asked. Use when the user asks to record what they just did, add a waypoint for a change, or update their map or Cognitive Tours after a change or a work session."
user-invocable: true
disable-model-invocation: false
---

# Suggest Waypoint Skill

Purpose: help the user notice what recent work deserves a waypoint, and
get it onto the map without the typing. The skill does the clerical
part: it creates the waypoints and links in small related batches, after
the user approves each batch, and places them beside the waypoints they
relate to. The user writes the understanding: each description, in the
app. The skill helps with that only when asked.

Run it at the end of a session, or any time the user suspects work went
unrecorded.

Usage: `/suggest-waypoint`, optionally `since YYYY-MM-DD` and/or
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
2. **Read the map.** Fetch `<site>/api/data` with a plain GET
   (`curl -sS <site>/api/data`) into a scratch file and work from it
   with `jq`. It holds `waypoints` (`id`, `label`, `type`,
   `description`, `notes`, `filePath`), `edges` (`source`, `target`,
   `label`) and `tours`. Each waypoint also has `position` (`{x, y}`),
used for placement in step 4. Nothing is written until step 4, and
then only what the user approved.
3. **Since when.** Use the `since` argument if given. Otherwise use the
   date of the newest `backups/backup-*.json` if there is one, or else
   today. Say which date you chose and why.

## 1. What happened

- `git log --since='<date> 00:00' --name-only --format='%h %s'` (the `00:00` matters: a bare date means that day at the current time): the commits
  and the files they changed.
- If `.bram/worklist-history/` (or, in older Bram projects,
  `resources/worklist-history/`) exists, read the
  `.md` entries in that window: each committed item's before/after text
  is the best record of **why** a change was made.
- The map: which changed files already have a waypoint, and which
  ADR waypoints and `docs/adr/` files exist.

## 2. Candidates, as a short list of batches

Not one waypoint per changed file. The user doesn't want to record
every detail; the goal is what future-them, or a newcomer, would need
explained. Rank in this order:

1. **Decisions** (ADR-worthy): a choice between alternatives with a
   reason. Put first any that **contradict an existing ADR** or ADR
   waypoint, and name it.
2. **New subsystems or capabilities** (Feature, Code Component).
3. **Risks** the work introduced.
4. **Everything else** (small UI tweaks, demos, reverts) in one line:
   "probably not worth a waypoint".

**Group them into batches of related waypoints**, 2–5 each: what
belongs together, such as one piece of work's decision, its code and
its test. At most about three batches.

**Show them high level: one line per batch,** its name, how many
waypoints and why it matters, and nothing more. No labels, files or
links yet; those come in step 3, for the one batch picked. For example:

```
A. Team sites (3 waypoints): a decision that contradicts ADR 007
B. Skills plugin (2): how the skills reach other repos
C. Start here walkthrough (2)
```

Also say, in one line, if existing waypoints were probably made stale,
and point to `/audit-waypoints` for those.

Then ask which **one** batch to do (or none), and wait. Work on only
that batch, through step 5. Only when the user is done with it, show
the list again with what's left ("Done: A. Next: B or C?").

## 3. The plan for one batch

For the batch picked, show exactly what will be added, as fact fields:

- **Label**, **type**, **file path** (repo-relative).
- **Edges**, to existing waypoints and within the batch, each with its
  direction and a label from this list where one fits: **motivates**
  (Goal → User Need), **supported by** (User Need → Feature),
  **contains** (Feature → Feature), **implemented by** (Feature → Code
  Component), **decomposes into** (Code Component → Code Component),
  **leads to** (ADR → Code Component or Feature), **validates** (Test →
  Feature), **threatens** (Risk → Feature or ADR). Waypoint types: Goal,
  User Need, Feature, ADR, Code Component, Test, Risk, AI Instruction,
  Open Question, Deprecated.
- **Where it goes**, in words the user can find on the map: "right of
  *TourBar*", "below the map, on the left".
- **Description: left empty**, for the user to write in the app, unless
  the user has already said in this conversation what it is or why; then
  use their words, and say so.

End with: "**Nothing has been added yet.** Reply **add them** to put
this batch on the map, or tell me what to change (a label, a link, where
one goes, or drop one). Or make them yourself in the app: the more you
do by hand, the more of it you'll remember." Offer the manual route
every time, in that one line; never press it.

Then wait. Adjust and re-show until the user says to add them.

**If the user makes them by hand:** the plan above is their checklist
(**+ Add Waypoint**, then drag between waypoints to link them, typing
the label). Skip step 4, go straight to step 5, and on **check** also
confirm the fields and links match the plan.

## 4. Add the batch

Only after the user's OK. Build each request body in a scratch file
with `jq`, then send it with `curl -sS -X POST -H 'Content-Type:
application/json' --data @<file> <site>/api/<route>`.

- **Ids:** `w-<ms>-<6 random a–z0–9>` for waypoints, `e-…` for edges
  (`<ms>` is the current time in milliseconds). Make every id unique.
- **Waypoints** → `POST /api/waypoints`:
  `{id, label, type, description, notes, filePath, position: {x, y}}`,
  with `description: ""` and `notes: null` unless step 3 said otherwise.
- **Edges** → `POST /api/edges`: `{id, source, target, label}`, after
  their waypoints exist.

**Placement**, from the positions in `/api/data` (re-read it first: the
user may have moved things):

- A new waypoint linked to an existing one goes **beside it**: right
  (`x + 300`, same `y`), else below (`x`, `y + 200`), else left, else
  above. A spot is free when no waypoint, existing or just placed, has
  its position within **260 px horizontally and 140 px vertically** of
  it (nodes are up to 180 px wide and two or three lines tall). Take
  the first free spot; if none is, step another 300 right and try
  again.
- Several new waypoints linked to the same one go in a **column** beside
  it (`y`, `y + 150`, `y + 300`, …), each still checked for space.
- One linked only to other new waypoints goes beside them, by the same
  rule, once they're placed.
- One with no links goes in a **row below the whole map**: `y = (largest
  existing y) + 300`, from the smallest existing `x`, 300 apart.
- Never move an existing waypoint.

**If a request returns 401**, the site has an edit passcode. Ask the
user for it, and send it in the `x-edit-passcode` header. Keep it out of
files you leave behind: delete the scratch files at the end, and never
echo it back.

**Stop at the first failure.** Report what was created and what wasn't,
by label. Don't retry blindly and don't delete what was made.

Then re-read `<site>/api/data` and confirm the new waypoints are there.

## 5. Hand over the descriptions

The description is where the understanding goes, so it's the user's.
List the waypoints just added, by label and where they are, and say:

> Open the map (refresh it if it was already open). To find each one,
> type its label in the **search box** at the top right of the map;
> new ones have a **red halo** until you click them or write a
> description. The map makes room for them when you open it, pushing
> any waypoints they overlap aside.
> **Double-click** it and write its description.
> Start from: what would you want to read here in three months? Why
> does it exist, and what would confuse someone without it? Reply
> **check** when you've written them and I'll read them back.

Waypoint content must make sense on its own, whatever tour brings a
reader to it: no "next we'll see…" in a waypoint.

**More help, only when asked:**

- **"check"**: re-read `/api/data` and react to each new description,
  briefly: is the why there? Anything factually off (cite file:line)?
  Don't rewrite it. If the user then gives a revised sentence in chat,
  offer to save it.
- **Writing in chat**: if the user answers here instead, save their
  words as the description with `PUT /api/waypoints/<id>`, sending only
  `{description}` (it changes only the fields sent), after showing it.
- **Asking you to write one**: nudge once, briefly, to try first ("Try
  one sentence: what would you want to read here in three months? I'll
  react to it"). If they still want it, show a short draft, and save it
  only on their OK, with a provenance line at the end of Notes, naming
  yourself (Claude or Codex) and the date:
  `Description drafted with Claude's help, Nov 3.` Ask the user to add
  their own line when they edit it (`Edited by <name>, <date>: <what
  changed>`). Never replace existing notes lines; the list only grows.
  Text the user wrote needs no marker.

Then wait. When the user is done with this batch, show what's left of
the list from step 2, one line each, and let them pick the next (or
stop). When the batches are done, say so, and suggest `/suggest-tour`
to place the new waypoints in tours.

## Never

- Write anything the user hasn't seen and approved, in this
  conversation, for this batch.
- Delete a waypoint or an edge, or move an existing waypoint.
- Change text the user wrote (a description, notes, a label) without
  their OK, or draft a description they didn't ask for.
- Edit the app's database files directly, or the user's repo.
- Write a passcode anywhere, or a site address into a tracked file.
