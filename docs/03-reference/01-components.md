# 🧩 Catálogo de Componentes

Componentes reutilizables ubicados en `src/components/`. Diseñados para ser independientes de la página que los consume.

---

## Componentes de Layout

### `Sidebar`
**Archivo**: `Sidebar.jsx`

Navegación principal de la aplicación. Se renderiza solo cuando hay un usuario autenticado.

| Feature | Detalle |
|---------|---------|
| Secciones | Generadas dinámicamente desde `navigation.js` por rol |
| Collapsible | Estado persistido en localStorage (`aulaaldia-sidebar-collapsed`) |
| Mobile | Drawer con overlay, se cierra con Escape o al navegar |
| Branding | Logo del tenant o iniciales como fallback |
| Tour | Resalta el item actual del tour con clase `--tour-target` |
| Footer | NotificationBell + Profile link + Logout |

**Dependencias**: `useAuth`, `useTour`, `getNavigationSections`, `getBrandInitials`

---

### `PublicLayout`
**Archivo**: `PublicLayout.jsx`

Wrapper para páginas públicas (Home, FAQ, Contact, Legal). Agrega el `PublicNavBar` encima del contenido.

```jsx
<PublicLayout>
  <Home />
</PublicLayout>
```

---

### `PublicNavBar`
**Archivo**: `PublicNavBar.jsx`

Barra de navegación para páginas públicas con links a Home, FAQ, Contact y login/registro.

---

### `NavBar`
**Archivo**: `NavBar.jsx`

Barra de navegación superior (usada internamente, complementa el Sidebar en ciertas vistas).

---

## Componentes de Protección

### `ProtectedRoute`
**Archivo**: `ProtectedRoute.jsx`

Guard de rutas con soporte para roles, tenant y año escolar.

**Props**:

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `roles` | `string[]` | `null` | Roles permitidos |
| `allowedRoles` | `string[]` | `null` | Alias de `roles` |
| `requireTenant` | `boolean` | `false` | Requiere tenant activo |
| `requireActiveSchoolYear` | `boolean` | `false` | Requiere año escolar activo |
| `activeSchoolYearExemptRoles` | `string[]` | `[]` | Roles exentos del gate |

Ver [Routing y Navegación](../02-guides/02-routing.md) para detalles del flujo de evaluación.

---

## Componentes de UI

### `Alert`
**Archivo**: `Alert.jsx`

Componente de alerta inline simple.

```jsx
<Alert type="error" message="Algo salió mal" />
```

---

### `ConfirmDialog`
**Archivo**: `ConfirmDialog.jsx`

Modal de confirmación reutilizable para acciones destructivas.

```jsx
<ConfirmDialog
  open={showConfirm}
  title="¿Eliminar materia?"
  message="Esta acción no se puede deshacer."
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
/>
```

---

### `StatCard`
**Archivo**: `StatCard.jsx`

Tarjeta de estadística para dashboards con título y valor.

```jsx
<StatCard title="Estudiantes" value={42} />
```

---

### `StatusBadge`
**Archivo**: `StatusBadge.jsx`

Badge visual para estados (activo, inactivo, pendiente, etc.).

```jsx
<StatusBadge status="active" />
```

---

### `SchoolHeader`
**Archivo**: `SchoolHeader.jsx`

Header con información del colegio (nombre institucional).

---

### `ThemeToggle`
**Archivo**: `ThemeToggle.jsx`

Toggle para alternar entre dark y light mode. Usa `useTheme()`.

---

## Componentes de Notificaciones

### `NotificationBell`
**Archivo**: `NotificationBell.jsx` (12.5KB — componente complejo)

Campanita de notificaciones con:
- Polling periódico del conteo de no leídas
- Dropdown con lista de notificaciones
- Acciones: marcar como leída, marcar todas, eliminar todas
- Integración con sidebar (modo colapsado)

**Props**: `sidebarMode`, `collapsed`

---

## Componentes de Onboarding

### `AppTour`
**Archivo**: `AppTour.jsx`

Componente que orquesta el tour onboarding usando `react-joyride`. Se carga con `React.lazy()`.

---

### `ContextualTipBanner`
**Archivo**: `ContextualTipBanner.jsx`

Banner que muestra un tip contextual basado en la ruta actual del usuario. Los tips se definen en `navigation.js`.

---

### `WelcomePanel`
**Archivo**: `WelcomePanel.jsx` (7.4KB)

Panel de bienvenida mostrado en el Dashboard con accesos rápidos y estado del tour.

---

### `SidebarBanner`
**Archivo**: `SidebarBanner.jsx` (6KB)

Banner promocional o informativo dentro del sidebar.

---

## Componentes de Formularios

### `CSVUpload`
**Archivo**: `CSVUpload.jsx`

Componente para subir archivos CSV con validación de tipo.

---

### `HierarchicalSelector`
**Archivo**: `HierarchicalSelector.jsx` (5.8KB)

Selector jerárquico encadenado: Grado → Sección → Curso. Cada nivel filtra las opciones del siguiente.

---

### `LegalConsentField`
**Archivo**: `LegalConsentField.jsx`

Checkbox de consentimiento legal con link a los términos y condiciones.

---

### `TurnstileCaptcha`
**Archivo**: `TurnstileCaptcha.jsx` (4.1KB)

Integración con Cloudflare Turnstile para protección contra bots en formularios públicos (registro, contacto).

---

## Mapa Visual de Componentes

```
┌─────────────────────────────────────────────────┐
│                    App Shell                     │
│  ┌──────────┐  ┌────────────────────────────┐   │
│  │ Sidebar  │  │  ContextualTipBanner       │   │
│  │          │  │  ┌──────────────────────┐  │   │
│  │ NavItems │  │  │                      │  │   │
│  │ (data-   │  │  │   Page Content       │  │   │
│  │  driven) │  │  │                      │  │   │
│  │          │  │  │  StatCard  Alert     │  │   │
│  │──────────│  │  │  StatusBadge         │  │   │
│  │ 🔔 Bell  │  │  │  ConfirmDialog       │  │   │
│  │ 👤 Profile│  │  │  HierarchicalSelector│  │   │
│  │ 🚪 Logout │  │  │                      │  │   │
│  └──────────┘  │  └──────────────────────┘  │   │
│                └────────────────────────────┘   │
│  AppTour (overlay)    ThemeToggle (header)       │
└─────────────────────────────────────────────────┘
```
