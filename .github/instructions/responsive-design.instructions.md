---
applyTo: '**/*.{js,jsx,ts,tsx,css,html}'
description: "Apply responsive-design skill patterns project-wide for all frontend code changes."
---

# Responsive Design Defaults (Project-Wide)

Use these rules for every frontend change in this repository.

## Core Rules

- Build mobile-first, then enhance for larger breakpoints.
- Prefer fluid sizing with `clamp()` for typography and spacing.
- Prefer intrinsic and fluid layouts (`grid`, `flex`, `minmax`, `auto-fit`) over fixed pixel widths.
- Use container queries for component-level adaptation when a component is reused in multiple layout contexts.
- Choose breakpoints by content pressure, not device names.

## Breakpoint Baseline

Start from mobile base styles, then progressively add:

- `@media (min-width: 640px)`
- `@media (min-width: 768px)`
- `@media (min-width: 1024px)`
- `@media (min-width: 1280px)`
- `@media (min-width: 1536px)`

## Layout and Overflow Safety

- Prevent horizontal overflow in all viewports.
- Avoid fixed-width containers that can exceed viewport width.
- Use `minmax()` and `repeat(auto-fit, ...)` or `repeat(auto-fill, ...)` for responsive grids.
- Ensure tables and dense data blocks have a mobile fallback (horizontal scroll or card layout).

## Accessibility and Interaction

- Keep touch targets at least `44x44px`.
- Preserve readable text sizes on small screens.
- Ensure navigation adapts cleanly between collapsed and expanded states.

## Media and Performance

- Use responsive images (`srcset` + `sizes`) where relevant.
- Keep hero/media content from causing layout shift or overflow.
- Use modern viewport units (`dvh`, `svh`, `lvh`) where full-height sections are needed.

## Project Alignment

- Reuse design tokens and CSS variables from `frontend/src/styles.css`.
- Keep responsive behavior consistent with existing patterns in the codebase.
