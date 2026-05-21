# ADR 001: Use React Flow for Graph Visualization

**Date**: 2026-05-21
**Status**: Accepted

## Context

Shrimp 2.0 requires an interactive graph canvas where users can:
- View waypoints as draggable nodes with type-specific visual styling
- See directed edges between waypoints
- Create connections by dragging from a node handle to another node
- Pan and zoom the canvas to navigate larger maps

Building this from scratch with raw SVG or Canvas would require significant custom work: hit-testing, drag handling, edge routing, viewport transforms, and connection interaction. This is not Shrimp's core value and would consume weeks of development time.

## Decision

Use `@xyflow/react` (React Flow v12) for all graph visualization and interaction.

## Consequences

**Positive**:
- Saves several weeks of custom graph rendering and interaction work
- TypeScript-first API with well-typed node, edge, and event interfaces
- Mature library with an active community and good documentation
- Built-in pan/zoom, node dragging, edge deletion, and connection handles
- Custom node types allow full control over node appearance (used for type-colored cards)

**Negative**:
- Adds a third-party dependency (~200KB gzipped) to the bundle
- Requires understanding React Flow's controlled-flow model (`nodes`/`edges` as React state + `applyNodeChanges`/`applyEdgeChanges`)
- React Flow components must be `'use client'` — incompatible with React Server Components
- CSS must be imported explicitly (`@xyflow/react/dist/style.css`) or default styles are missing
