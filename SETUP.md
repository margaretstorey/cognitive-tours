# SETUP.md

## Prerequisites
- Node.js (LTS) and npm
- A GitHub account (to fork or clone)
- A Turso account, free tier is fine (only needed if you want a deployed/shared instance rather than local-only)
- A Vercel account (only if deploying, not needed for local-only use)

## 1. Clone the repo

git clone https://github.com/margaretstorey/cognitive-tours.git
cd cognitive-tours
npm install

## 2. Set up your database

**Local-only (simplest, good for trying it out):**
- Use SQLite locally, no Turso account needed.
- Copy `.env.example` to `.env` and point `DATABASE_URL` at a local SQLite file.

**Deployed/persistent (like the production setup):**
- Create a Turso database under your own account.
- Copy the resulting `DATABASE_URL` and `AUTH_TOKEN` into `.env`.
- These are your own credentials, entirely separate from the original production database.

## 3. Run migrations

npx prisma migrate deploy

This creates the schema (waypoints, tours, TourWaypoint join table with narrative/Bridge field, etc.) in your own database.

## 4. Clear or replace the seed data
- Open `mock-data.ts`.
- Either empty it out to start with a blank slate, or replace it with a couple of example waypoints describing your own project, so the app isn't showing Cognitive Tours' own architecture.

## 5. Run it locally

npm run dev

Visit `localhost:3000`, confirm the three-panel layout loads with your (empty or sample) data.

## 6. (Optional) Deploy your own instance
- Connect your fork to Vercel.
- Add your Turso `DATABASE_URL`/`AUTH_TOKEN` as Vercel environment variables (never commit these).
- Deploy. This gives you your own URL, fully independent of the original deployment.

## What you get for free
The whole comprehension model, waypoint types, tour navigation, docent mode, markdown view, the underlying ontology.

## What you build yourself
The actual waypoints and tours describing your codebase.