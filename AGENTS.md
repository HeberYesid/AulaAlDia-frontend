# Repository Guidelines

## How to Use This Guide

- Use this guide for all work inside `AulaAlDia-Frontend/`.
- The root `../AGENTS.md` applies here too, but this file wins when it is more specific.
- Preserve the existing design system, routing, and auth flow.

## Useful Skills

| Skill | Use when |
| --- | --- |
| `frontend-design` | Building or refactoring UI with a strong visual direction |
| `responsive-design` | Fluid layouts, breakpoints, mobile-first behavior |
| `accessibility` | WCAG, keyboard support, semantic markup, screen reader work |
| `vitest` | Unit tests and React Testing Library coverage |
| `playwright-cli` | Browser-level verification and E2E workflows |

## Build, lint, and test commands

```powershell
cd AulaAlDia-Frontend
pnpm install
pnpm lint
pnpm build
pnpm test:run
pnpm test:integration
pnpm test:coverage
```

## Single Test Examples

```powershell
cd AulaAlDia-Frontend
pnpm test:run -- src/pages/__tests__/Login.test.jsx
pnpm test:run -- src/pages/__tests__/Login.test.jsx -t "render"
```

## High-Level Architecture

- `src/main.jsx` wires the app providers.
- `src/App.jsx` owns the route table and lazy-loaded pages.
- `src/api/axios.js` centralizes auth, refresh, and tenant header behavior.
- `src/state/` contains session and theme state.
- `src/styles.css` and `src/styles/` hold shared tokens and global styles.
- `src/pages/` contains route-level screens.
- `src/components/` contains reusable UI components.

## Tech Stack

- React 18 (functional components + hooks).
- Vite (bundling and dev server).
- JavaScript/JSX.
- React Router (routing).
- Axios (HTTP client via shared instance in `src/api/axios.js`).
- Vitest + React Testing Library (unit/integration testing).
- Playwright (browser-level verification).
- CSS with shared tokens and global styles in `src/styles.css` and `src/styles/`.

## Project Structure

- `src/main.jsx`: app bootstrap and provider wiring.
- `src/App.jsx`: app shell and route table.
- `src/api/`: API clients and request/response behavior.
- `src/state/`: auth/session/theme state and global client state.
- `src/pages/`: route-level screens.
- `src/components/`: reusable presentational and shared components.
- `src/styles/`: design tokens, shared styles, and visual primitives.
- `src/pages/__tests__/` and related `__tests__` folders: UI and behavior tests.

## Key Codebase Conventions

- Use the shared Axios client for API requests.
- Keep `AuthContext` or the current session state as the source of truth for login and tenant data.
- Preserve the mobile-first responsive patterns already used in `src/styles.css`.
- Reuse existing design tokens instead of introducing ad hoc colors or spacing.
- Prefer accessible, semantic markup and keyboard-friendly interactions.
- Keep component changes aligned with the current React 18 + Vite structure.
- Add or update Vitest coverage for behavior changes.

## Naming Conventions

- Components: `PascalCase` filenames and exports (example: `StudentCard.jsx`).
- Hooks: `camelCase` with `use` prefix (example: `useSession.js`).
- Utilities/helpers: `camelCase` (example: `formatDate.js`).
- Constants: `UPPER_SNAKE_CASE` for true constants, otherwise descriptive `camelCase`.
- Test files: `*.test.jsx` colocated or inside `__tests__` with clear behavior-focused names.
- CSS classes: follow existing project pattern; prefer semantic names over visual-only names.
- Routes/pages: keep route-level component names explicit and aligned with URL intent.

## QA Checklist

- Run lint: `pnpm lint`.
- Run unit/integration tests impacted by change: `pnpm test:run -- <target>`.
- Run full test suite for risky/shared changes: `pnpm test:run`.
- Validate build health: `pnpm build`.
- Verify responsive behavior on key breakpoints (mobile/tablet/desktop).
- Verify accessibility basics: keyboard navigation, focus visibility, semantic structure.
- Confirm auth and tenant-dependent flows still work with the shared Axios/session behavior.
- Confirm no design-token regressions (spacing, color, typography consistency).

## Critical Rule (Non-Negotiable)

- Never bypass the shared auth/session + Axios flow (`AuthContext` and `src/api/axios.js`) with ad hoc API clients, direct token storage hacks, or duplicate refresh logic.

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Building or refactoring UI components | `frontend-design` |
| Implementing responsive layouts or breakpoints | `responsive-design` |
| Improving accessibility, semantics, or keyboard support | `accessibility` |
| Writing or updating component tests | `vitest` |
| Verifying browser behavior or flows | `playwright-cli` |
