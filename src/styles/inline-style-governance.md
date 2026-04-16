# Inline style governance (Phase 3.3)

This project follows a **no new `style={{}}`** rule in governed frontend files.

## Rule

- Prefer classes + design tokens from `styles.css`.
- Do **not** add inline styles for static or variant-based styling.
- In Phase 3.3, ESLint enforces this in these files:
  - `src/App.jsx`
  - `src/components/{Alert,ConfirmDialog,PublicNavBar,Sidebar}.jsx`
  - `src/pages/{UserProfile,MyBulletins,AdminBulletins,Observer,StudentDashboard,TenantOperationsAudit}.jsx`
  - `src/pages/SubjectDetail/ResultsTab.jsx`

## Allowed runtime-only patterns (exception by design)

Inline styles are allowed **only** when values are truly runtime-dynamic and cannot be represented cleanly by classes/tokens without combinatorial explosion.

Typical allowed cases:

1. **Calculated geometry/position**
   - `width/height/left/top/transform` derived from runtime measurements (e.g., drag position, canvas overlays, virtualized lists).
2. **User-driven continuous values**
   - Slider/graph/preview values where every render can produce a unique numeric value.
3. **Third-party API interop**
   - A library requires runtime style object injection and class hooks are insufficient.
4. **Single-use CSS custom property bridge**
   - Inline `style={{ '--x': value }}` only to feed a documented CSS variable where class alternatives are not practical.

## Required rationale when using runtime-only inline styles

If you introduce a runtime-only inline style outside governed files:

- Add a short code comment near usage explaining **why** classes/tokens are insufficient.
- Keep style object minimal (only the runtime keys).
- Avoid mixed objects with static values (move static part to classes).

Example:

```jsx
// Runtime-only: pixel-perfect drag preview position from pointer events.
<div className="drag-preview" style={{ transform: `translate(${x}px, ${y}px)` }} />
```
