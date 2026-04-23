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

## Key Codebase Conventions

- Use the shared Axios client for API requests.
- Keep `AuthContext` or the current session state as the source of truth for login and tenant data.
- Preserve the mobile-first responsive patterns already used in `src/styles.css`.
- Reuse existing design tokens instead of introducing ad hoc colors or spacing.
- Prefer accessible, semantic markup and keyboard-friendly interactions.
- Keep component changes aligned with the current React 18 + Vite structure.
- Add or update Vitest coverage for behavior changes.

## Auto-invoke Skills

| Action | Skill |
| --- | --- |
| Building or refactoring UI components | `frontend-design` |
| Implementing responsive layouts or breakpoints | `responsive-design` |
| Improving accessibility, semantics, or keyboard support | `accessibility` |
| Writing or updating component tests | `vitest` |
| Verifying browser behavior or flows | `playwright-cli` |
