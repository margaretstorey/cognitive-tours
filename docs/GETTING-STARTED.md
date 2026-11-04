# Getting started with Cognitive Tours

Cognitive Tours is a map of a software project: **waypoints** for what
matters (goals, user needs, features, decisions, code, tests, risks, open
questions), linked to each other, and **tours** that walk a reader through
them in order, with a short narrative between stops. You build the map
yourself; writing it is how the understanding gets built. See the
[README](../README.md) for the ideas behind it.

## 1. Try it (nothing to install)

| Site | What it's for |
|---|---|
| [The demo](https://cognitive-tours-demo.vercel.app) | A copy of the author's own map of Cognitive Tours. Choose **"A Research Story Behind Cognitive Tours"** in the tour selector and step through it with **Next**. It's reset every night, so edits don't last. |
| [The Flask example](https://cognitive-tours-demo-flask.vercel.app) | The same tool used on a codebase its author didn't write (a fork of Flask). |
| Sandboxes: [1](https://cognitive-tours-sandbox1.vercel.app), [2](https://cognitive-tours-sandbox2.vercel.app), [3](https://cognitive-tours-sandbox3.vercel.app), [4](https://cognitive-tours-sandbox4.vercel.app), [5](https://cognitive-tours-sandbox5.vercel.app), [6](https://cognitive-tours-sandbox6.vercel.app), [7](https://cognitive-tours-sandbox7.vercel.app), [8](https://cognitive-tours-sandbox8.vercel.app), [9](https://cognitive-tours-sandbox9.vercel.app) | Blank maps for writing your own waypoints and tours. Pick one nobody else is using. |

**Things to try in a sandbox:**
- **Add Waypoint** (in the waypoint panel): give it a label, a type and, if it
  belongs to a file, the file's path in your repo.
- Drag from one waypoint to another to connect them, and name the link
  (for example "motivates" or "implemented by").
- **+ New Tour**: pick waypoints in order and write the narrative for each
  stop. Then step through it with **Next**, or switch to **Markdown View**.

**Point a sandbox at your code.** Both settings belong to your browser, so
each person sets their own:
- **"View on GitHub":** on a waypoint with a file path, choose **Set your
  team's GitHub repo** and paste the repo's URL.
- **"Open in VS Code":** enter **Your code folder**, the folder where the repo
  is checked out on this computer.

A file path can also be a full `https://` link (a doc, notes in another
repo); it's used as it is.

**Keep your work.** Anyone can edit a sandbox, and its map may be cleared.
Use **Download backup** (top right) to save a copy, and **Export tour** or
**Export full map** for a readable Markdown version.

## 2. Use it on your own project

- **Ask for a site.** Each team in the author's course gets its own site and
  database, with an empty map.
- **Or run your own copy,** locally or deployed: see [SETUP.md](../SETUP.md).

## 3. The AI skills (Claude Code)

Four [Claude Code](https://claude.com/claude-code) skills help keep a map in
step with the code. They **ask questions and report; you write everything
in the app.** They only read the map (the site's `/api/data`) and never write
to it.

| Skill | What it does |
|---|---|
| `/suggest-waypoint` | Finds recent work worth recording (decisions first), asks you about it, and gives the fact fields (label, type, file path, links) to enter. You write the description. |
| `/suggest-tour` | Suggests where new waypoints fit in tours, and asks you to write each stop's narrative. |
| `/audit-waypoints` | Checks code, ADR and test waypoints against the files they link to, and lists what has drifted. |
| `/audit-tours` | Finds recently changed files that no waypoint or tour covers, stale or repetitive narratives, and redundant links. |

**Add them to your own repo:**
1. Copy the four folders from this repo's `.claude/skills/`
   (`suggest-waypoint`, `suggest-tour`, `audit-waypoints`, `audit-tours`)
   into your repo's `.claude/skills/`.
2. Tell them which map to read: either add `MY_SITE_URL=https://<your-site>`
   to your repo's `.env`, or name the site each time:
   `/suggest-waypoint site https://<your-site> since 2026-11-01`.
3. Run them from your repo in Claude Code. They use `git log` to see what
   changed.

**Optional:** an ontology in your `CLAUDE.md` (which links mean what) gives
`/suggest-waypoint` better link labels; without one it suggests plain ones.
If your repo uses [Bram](https://github.com/judell/bram), the suggest skills
also read its worklist history for the "why" behind changes. Neither is
needed.

## Before you share a link

There's **no login and no undo**: anyone with a site's link can change its
map. Download a backup before sharing it, and again after a working session.
