<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0 (MINOR: new principle added)

Principles added:
  - VI. Waypoints and Tours are Universal (new)

Principles modified: none

Sections modified:
  - Development Workflow — updated "all five Core Principles" → "all six Core Principles"

Templates requiring updates:
  ✅ .specify/memory/constitution.md — this file
  ✅ .specify/templates/plan-template.md — Constitution Check gate VI added

Deferred TODOs: none
-->

# Shrimp 2.0 Constitution

## Core Principles

### I. Simplicity Over Complexity

Every design decision MUST favor the simpler option. Features, abstractions, and dependencies are added
only when there is clear, present need — not in anticipation of hypothetical future requirements.

- MUST NOT introduce abstractions before they are needed by at least two concrete use cases.
- MUST prefer plain data structures and straightforward control flow over clever patterns.
- Complexity MUST be justified with a written rationale in the PR or spec; unjustified complexity is a defect.
- YAGNI (You Aren't Gonna Need It) is a first-class rule, not a guideline.

### II. Incremental Growth

The project MUST grow one small, verifiable step at a time. Each increment delivers working, observable
value before the next begins.

- Each task or PR MUST leave the codebase in a better, runnable state than it found it.
- Large changes MUST be broken into independently mergeable slices.
- No half-finished implementations are acceptable; a feature is either fully complete to its defined scope
  or not merged.
- MUST NOT build scaffolding, stubs, or placeholders that will "be filled in later" unless the placeholder
  itself is the defined deliverable.

### III. Intent Before Implementation

Understanding the problem MUST precede writing any code. Implementation begins only after the user's
intent is clear and the acceptance criteria are agreed upon.

- Every feature MUST have a spec with user stories and acceptance scenarios before implementation starts.
- Ambiguity in requirements MUST be resolved via `/speckit-clarify` before planning begins.
- Code MUST NOT be written speculatively to "see how it feels" — prototype spikes, if used, MUST be
  explicitly scoped and discarded unless promoted to production quality.
- Implementation decisions that diverge from the spec MUST be documented and confirmed with the user.

### IV. Clean, Readable TypeScript

All source code MUST be written in TypeScript and optimized for human readability. Correctness is
verified by the type system, not by documentation.

- Strict TypeScript (`strict: true`) is REQUIRED; type assertions (`as`) and `any` are forbidden except
  in explicitly justified, isolated cases reviewed in PR.
- Names MUST be clear and self-describing; abbreviations are forbidden unless universally understood
  (e.g., `id`, `url`).
- Functions MUST do one thing; a function requiring more than one level of reasoning to understand MUST
  be decomposed.
- Comments MUST NOT explain what the code does. Comments are reserved for non-obvious WHY — hidden
  constraints, subtle invariants, workarounds for specific external bugs.
- No dead code, commented-out code, or TODO comments in merged code; these are defects.

### V. Minimal, Clear UI

The user interface MUST communicate only what the user needs at the moment they need it. Decoration and
density are enemies of clarity.

- Every UI element MUST earn its place: if removing it does not reduce usefulness, it MUST be removed.
- Visual hierarchy MUST guide the user's eye to the most important action or information first.
- MUST NOT add color, animation, or styling for aesthetic reasons alone; each visual treatment MUST serve
  a functional purpose (state change, hierarchy, feedback).
- Interaction patterns MUST be standard and predictable; novel UI patterns require explicit justification.
- The UI MUST remain fully usable at the minimum supported viewport without horizontal scrolling.

### VI. Waypoints and Tours are Universal

A Waypoint can represent anything meaningful in a project: a decision, a risk, a component, a todo,
or an open question. A Tour can represent any ordered narrative: an onboarding guide, a prioritized
backlog, a sprint, or a roadmap. Shrimp is not just a code understanding tool — it is a unified
intent and navigation layer for software projects.

- The eight built-in waypoint types (User Need, Feature, ADR, Code Component, Test, Risk,
  AI Instruction, Open Question) are a starting set, not a closed taxonomy.
- Features MUST NOT be designed to constrain waypoints to code-only or documentation-only contexts;
  the data model and UI MUST remain domain-agnostic.
- Tours MUST be usable as onboarding guides, prioritized backlogs, sprint plans, or roadmaps —
  not only as "reading paths" through code.
- Any feature that makes Shrimp useful only for software codebases is a violation of this principle
  unless it is explicitly opt-in and does not degrade the general-purpose experience.

## Technology Standards

- **Language**: TypeScript (strict mode). No JavaScript files in `src/`.
- **Framework**: Next.js (App Router). Read `node_modules/next/dist/docs/` before writing any framework code.
- **Styling**: Tailwind CSS utility classes. No inline `style` props except for dynamic values unavailable
  in Tailwind.
- **State**: Server Components by default; client state only where interactivity genuinely requires it.
- **Testing**: Vitest for unit/integration; Playwright for end-to-end. Tests live adjacent to the code
  they cover (`*.test.ts` / `*.spec.ts`).
- **Formatting**: Prettier with project config. ESLint with `eslint-config-next`. CI MUST fail on lint
  or format violations.

## Development Workflow

- Features begin with `/speckit-specify` → `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` →
  `/speckit-implement`.
- Each stage MUST be committed before the next begins (enforced by extension hooks).
- PRs MUST reference the spec user story they satisfy.
- A Constitution Check MUST be performed at the start of plan.md and re-checked after Phase 1 design.
  The check MUST verify compliance with all six Core Principles before work is considered plannable.
- No feature is "done" until it passes its acceptance scenarios and the UI has been manually verified
  in a running browser.

## Governance

This constitution supersedes all other development practices and informal conventions. Any practice that
conflicts with it MUST be updated to comply.

**Amendment procedure**:
1. Open a PR with the proposed change to this file and a rationale.
2. The rationale MUST explain what problem the amendment solves and why the current principle is
   insufficient.
3. Amendments are versioned using semantic versioning:
   - MAJOR: removal or incompatible redefinition of a principle.
   - MINOR: addition of a new principle or materially expanded guidance.
   - PATCH: clarifications, wording, or typo fixes.
4. `LAST_AMENDED_DATE` is updated to the merge date of the amendment PR.

All PRs and code reviews MUST verify compliance with the Core Principles. Non-compliance is a blocking
review comment, not a suggestion.

**Version**: 1.1.0 | **Ratified**: 2026-05-21 | **Last Amended**: 2026-05-21
