---
name: "first-tours"
description: "Give an unfamiliar repo a starting Cognitive Tours map: read the repo, draft about a dozen waypoints and two short tours (the user's view and the builder's view, at most 8 stops each), show the plan, and after one OK add it to the site through its API. A starting point to read and then revise in your own words."
user-invocable: true
disable-model-invocation: false
---

# First Tours Skill

Purpose: the user has a repo they **don't know yet** and an empty
Cognitive Tours map. Instead of a blank page, this skill reads the repo
and puts a **starting map** on the site: waypoints with short
descriptions, a few edges, and two tours of at most 8 stops each. The
user reads those tours to get familiar with the repo, then corrects,
rewrites and extends the map as their own understanding grows and as
they make changes.

Everything it writes is marked as drafted by Claude, so it's always
clear what a person has checked and what they haven't.

This skill stands on its own: it doesn't rely on any CLAUDE.md, `.env`
or other file from the Cognitive Tours repo. Run it from inside the
project's own checkout.

Usage: `/first-tours site <url>`. The empty-map screen on a site has a
**Copy command** button that gives this command with its own address.
With the Cognitive Tours plugin installed, the command is
`/cognitive-tours:first-tours site <url>`. Without `site`, the skill
looks for a saved address (Setup, step 2).

## Setup

1. **The repo.** Work in the current directory. If it isn't a git
   checkout of the project (no `.git`, or it looks like something
   else), ask the user to open Claude Code in their project's repo, or
   to clone it first, and wait. Don't fetch remote repos.
2. **The site.** The `site <url>` argument; else a line
   `Cognitive Tours site: <url>` in the repo's `CLAUDE.local.md` or
   `CLAUDE.md`; else ask for the address and wait. When it was asked
   for, offer to remember it by adding that line to `CLAUDE.local.md`,
   only if git ignores that file (`git check-ignore -q
   CLAUDE.local.md`), or after adding it to `.gitignore` with the
   user's yes. Fetch `<url>/api/data` with a plain GET
   (`curl -sS <url>/api/data`) into a scratch file and read it with
   `jq`. It holds `waypoints`, `edges` and `tours`.
   - **Empty map:** go ahead.
   - **Not empty:** say how many waypoints and tours it has, and ask
     whether to add the starting map beside them anyway or stop. Wait.
     Never edit or delete anything already there.
   - Never write the site's address anywhere but that one line in
     an ignored `CLAUDE.local.md`.

## Vocabulary (Cognitive Tours)

Waypoint types: **Goal**, **User Need**, **Feature**, **ADR**
(architectural decision), **Code Component**, **Test**, **Risk**,
**AI Instruction**, **Open Question**, **Deprecated**.

Edge labels, used where they fit (source → target):

- Goal → *motivates* → User Need
- User Need → *supported by* → Feature
- Feature → *contains* → Feature
- Feature → *implemented by* → Code Component
- Code Component → *decomposes into* → Code Component
- ADR → *leads to* → Code Component or Feature
- Test → *validates* → Feature
- Risk → *threatens* → Feature or ADR

Not every true relationship needs an edge; the tour order already says
a lot. Aim for one edge per stop or fewer.

## 1. Read the repo (read-only)

Enough to explain it to a newcomer, not everything:

- `README*`, `docs/`, any ADR or decisions folder (`docs/adr/`, `adr/`,
  `decisions/`, `doc/architecture*`), specs, `CONTRIBUTING*`, and the
  repo's own `CLAUDE.md` or `AGENTS.md` if it has one.
- The layout: top-level folders, the package manifest (`package.json`,
  `pyproject.toml`, `go.mod`, …) for entry points and scripts, and the
  test folder.
- `git log --reverse --format='%h %ad %s' --date=short | head -20` (how
  it began) and the most-touched files:
  `git log --name-only --format= | sort | uniq -c | sort -rn | head -20`.
- Then open the entry point and the few files the builder's tour will
  stop at, so their descriptions are about what the code actually does.

Don't run the project or its tests. Don't edit the repo.

## 2. Draft the starting map

Two tours, at most 8 stops each, sharing one or two Feature stops where
intent meets code. About 12–15 distinct waypoints in all.

**The user's view: why it exists and what it does**

1. Goal: what the project is for
2. User Need: who needs it, and what for (1–2 stops)
3. Feature: what they can do with it (2–3 stops)
4. Feature or Code Component: the screen, page or command where a user
   meets it
5. Test: what checks that it works

**The builder's view: how it's put together** (this is also the
architecture overview)

1. Code Component: the entry point (where a request, command or page
   load starts)
2. Code Component: the main parts, in the order a request or data
   flows through them (2–3 stops)
3. Code Component: persistence or external services
4. ADR: the one decision that shaped it most
5. Risk: the thing most likely to bite a newcomer

For each waypoint:

- **Label:** a short name, not a sentence.
- **File path:** repo-relative, when there is one.
- **Description:** one to three plain sentences, true on their own,
  whatever tour brings a reader there (no "next we'll see…").
- **Notes:** where it came from (`From README.md and src/app.py.`),
  then the provenance line:
  `Drafted by Claude from the repo, <Mon D>: a starting point, not yet checked by a person.`

**Where the repo doesn't say, don't make it up.** If nothing states the
goal, a user need, or why a decision was made, make that stop an
**Open Question** waypoint instead ("What user need does the plugin
system serve? The repo doesn't say."). That gap is intent debt worth
seeing, and a good first thing to ask a teammate.

For each tour: a **name**, a one-line **description**, and a
**bridge** for each stop (the stop's narrative): one sentence that
carries a reader from this stop to the next. The last stop's is
optional.

## 3. Show the plan, then one OK

Show it compactly, in one message:

```
User's view: "Why Flask exists and what it does" (7 stops)
 1. [Goal] Small core, extensible web framework   README.md
    → bridge: …
 2. …
Builder's view: "How a request moves through Flask" (8 stops)
 …
Edges (9): Goal motivates "Build a web app quickly"; …
Open Questions (2): …
```

End the message with this on its own line, so it can't be missed at the
bottom of a long plan:

> **Nothing has been added to the map yet.** Reply **add it** to put this
> on the site, tell me what to change first, or say **stop**.

Wait. Apply any changes the user asks for and show only what changed,
ending with the same line.

## 4. Add it to the site

Only after the user's OK. Build each request body in a scratch file
with `jq`, then send it with `curl -sS -X POST -H 'Content-Type:
application/json' --data @<file> <url>/api/<route>`.

- **Ids:** `w-<ms>-<6 random a–z0–9>` for waypoints, `e-…` for edges,
  `t-…` for tours (`<ms>` is the current time in milliseconds). Make
  every id unique.
- **Waypoints** → `POST /api/waypoints`:
  `{id, label, type, description, notes, filePath, position: {x, y}}`.
  Lay them out so the tours read left to right: the user's view on one
  row (`y = 0`), the builder's view on another (`y = 350`), stops
  `x = 0, 300, 600, …` in tour order; a shared Feature sits once,
  between the rows (`y = 175`), and Open Questions below (`y = 700`).
  **On a map that isn't empty,** add `(largest existing y) + 400` to
  every `y`, so the starting map sits below what's there instead of on
  top of it.
- **Edges** → `POST /api/edges`: `{id, source, target, label}`, after
  their waypoints exist.
- **Tours** → `POST /api/tours`:
  `{id, name, description, author: "Claude (first-tours)", stops:
  [{waypointId, narrative}]}`, last.

**If a request returns 401**, the site has an edit passcode. Ask the
user for it, and send it in the `x-edit-passcode` header. Keep it out of
files you leave behind: delete the scratch files at the end, and never
echo it back.

**Stop at the first failure.** Report what was created and what wasn't,
by label. Don't retry blindly and don't delete what was made. The user
can fix or remove it in the app.

Then re-read `<url>/api/data` and confirm the counts.

## 5. Hand over

Tell the user, briefly:

- Open the site, pick the **user's view** tour, and step through it;
  then the **builder's view**. Have the code open beside it.
- As you read, **rewrite descriptions in your own words** where they're
  wrong, vague or not how you'd say it, and delete the "Drafted by
  Claude" line once you've checked a waypoint. Answer the Open
  Questions when you can (and change their type).
- Add waypoints for what you learn and what you change. `/suggest-waypoint`
  and `/suggest-tour`, if installed, help with that.

## Never

- Edit or delete anything already on the map.
- Write to the site before the user's OK on the plan.
- Edit files in the user's repo, except, with a yes, the site line
  in an ignored `CLAUDE.local.md` (and `.gitignore`, to ignore it).
- Write a passcode anywhere, or a site address into a tracked file,
  commit or public artifact.
