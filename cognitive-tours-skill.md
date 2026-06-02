Cognitive Tour: [Title]

Purpose
What understanding does this tour help rebuild?

Audience
Who is this for? Be specific.
Examples:
- New team member unfamiliar with the codebase
- Developer returning after several months
- Reviewer assessing a pull request
- Maintainer tracing a bug
- AI agent needing project context

Waypoints
For each waypoint include:
- Name
- Artifact location — always as a relative markdown link e.g. `[filename.ts](path/to/filename.ts)`
- Why it matters
- What understanding it provides

Example:

Waypoint 1: User Need
Artifact: [billing-requirements.md](docs/billing-requirements.md)
Why it matters: Explains the user problem this feature exists to solve.
Understanding gained: What the system is trying to achieve before looking at any code.

Waypoint 2: Core Implementation
Artifact: [invoice_service.ts](src/billing/invoice_service.ts)
Why it matters: Contains the main orchestration logic.
Understanding gained: How invoices are generated end to end.

Questions This Tour Answers
List 3–5 questions that someone should be able to answer after completing the tour.

Cognitive Debt Risks
Identify:
- Missing rationale
- Fragile assumptions
- Hidden dependencies
- Misleading names
- Knowledge likely to be lost if a key person leaves

Freshness Check
Evaluate whether the tour appears:
- Current
- Possibly stale
- Stale
Provide evidence for your assessment.

Maintenance Rules
When updating a tour:
1. Preserve the purpose of the tour.
2. Update file references when code moves.
3. Remove obsolete waypoints.
4. Add new waypoints only when they materially improve understanding.
5. Prefer concise tours — 4 to 7 waypoints is ideal.
6. Flag uncertainty rather than guessing.