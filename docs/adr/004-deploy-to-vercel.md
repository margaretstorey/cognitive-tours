# ADR 004: Deploy to Vercel

**Status:** Accepted  
**Date:** 2026-06-02  
**Related:** ADR 003 (Use Turso), app/lib/db.ts

---

## Context

Cognitive Tours needed a hosting platform for the Next.js app. Requirements:

- Zero-config deployment for Next.js
- Supports serverless API routes (used for all database mutations)
- Free tier sufficient for a single-user research tool
- Fast iteration — push to deploy without manual steps
- Supports environment variables for Turso credentials

---

## Decision

Deploy to Vercel.

Vercel is the natural host for Next.js apps — built by the same team, 
zero configuration required, and deploys automatically on every push to 
main. Serverless functions handle the API routes. Environment variables 
are set in the Vercel dashboard.

---

## Consequences

**Positive:**
- Push to main triggers automatic deploy — no manual steps
- Next.js API routes work as serverless functions with no extra config
- Free Hobby tier is sufficient for current usage
- Preview deployments available for branches

**Negative:**
- Ephemeral filesystem — SQLite cannot be used directly on Vercel 
  (resolved by Turso, see ADR 003)
- Vercel Git connection can silently disconnect — check Project Settings 
  → Git if deploys stop triggering (see CLAUDE.md Known Issues)

---

## Implementation

- Vercel project connected to `margaretstorey/cognitive-tours` on GitHub
- Environment variables set in Vercel dashboard:
  - `TURSO_DATABASE_URL`
  - `TURSO_AUTH_TOKEN`
- Auto-deploy on push to `main`

---

## Alternatives Considered

- **Netlify** — rejected; Next.js support is less seamless than Vercel
- **Railway** — rejected; adds cost and complexity not justified for 
  a research tool
- **Self-hosted** — rejected; maintenance overhead not worth it for 
  a single-user app