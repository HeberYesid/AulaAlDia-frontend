# 🏗️ Visión General de la Arquitectura

## ¿Qué es AulaAlDía?

AulaAlDía es una **plataforma educativa multi-tenant** diseñada para instituciones educativas colombianas. Cada institución (tenant) opera con su propio espacio de datos, branding personalizado y configuración académica independiente.

El frontend es una **Single Page Application (SPA)** construida con React 18 que consume una API REST provista por un backend Django/DRF.

---

## Stack Tecnológico

| Categoría | Tecnología | Versión | Propósito |
|-----------|-----------|---------|-----------|
| **Framework UI** | React | 18.3.1 | Componentes funcionales + hooks |
| **Bundler** | Vite | 7.3.2 | Dev server rápido, HMR, builds optimizados |
| **Routing** | React Router DOM | 6.30.3 | Client-side routing con guards |
| **HTTP Client** | Axios | 1.15.0 | Requests API con interceptores JWT |
| **Iconos** | Lucide React | 0.575.0 | Iconografía SVG tree-shakeable |
| **Auth Social** | @react-oauth/google | 0.12.2 | Login con Google OAuth |
| **Calendario** | react-big-calendar | 1.19.4 | Vista de calendario académico |
| **Onboarding** | react-joyride | 2.9.3 | Tour guiado para nuevos usuarios |
| **Markdown** | marked + DOMPurify | 18.0.2 / 3.4.1 | Renderizado seguro de contenido markdown |
| **Fechas** | date-fns | 4.1.0 | Formateo y manipulación de fechas |
| **JWT** | jwt-decode | 4.0.0 | Decodificación de tokens JWT |
| **Testing** | Vitest + RTL | 4.1.4 / 14.3.1 | Unit + integration testing |
| **E2E** | Playwright | 1.59.1 | Browser-level testing |
| **Linting** | ESLint | 9.39.4 | Análisis estático de código |
| **Package Manager** | pnpm | 10.24.0 | Gestión de dependencias |

---

## Decisiones Arquitectónicas Clave

### 1. Multi-Tenancy desde el Frontend

El frontend resuelve el tenant activo a través de:
- Header `X-Tenant-ID` en cada request API (inyectado por un interceptor Axios)
- Estado `activeTenantId` en `AuthContext`
- Branding dinámico (colores, logo, favicon) aplicado al DOM vía CSS custom properties

### 2. Autenticación JWT con Refresh Silencioso

- Tokens almacenados en `localStorage` bajo la key `auth`
- Interceptor de response que detecta 401 y ejecuta refresh automático
- Cola de requests pendientes durante el refresh para evitar race conditions
- Inactivity timeout configurable por usuario (default: 30 min)
- Sincronización cross-tab via `storage` event

### 3. Lazy Loading Universal

Todas las páginas se cargan con `React.lazy()` + `Suspense`, reduciendo el bundle inicial a lo esencial: shell de navegación + contextos.

### 4. Role-Based Access Control (RBAC)

Cuatro roles con permisos diferenciados:

| Rol | Acceso Principal |
|-----|-----------------|
| `ADMIN` | Dashboard admin, configuración académica, auditoría, gestión de usuarios, boletines institucionales |
| `TEACHER` | Materias, ejercicios, resultados, evaluaciones docentes, asistencia propia |
| `STUDENT` | Mis materias, resultados, boletines, evaluaciones docentes, observador |
| `TUTOR` | Progreso del estudiante vinculado, boletines, materias, observador |

### 5. Design System Notion-Inspired

El sistema de diseño se basa en la filosofía de Notion:
- Warm neutrals (grays con undertones amarillo-marrón)
- Whisper borders (`1px solid rgba(0,0,0,0.1)`)
- Multi-layer shadow stacks
- Dark/Light theme con persistencia en localStorage

### 6. Navigation Centralizada Data-Driven

La navegación (sidebar, navbar, tour) se genera desde un array centralizado en `utils/navigation.js`, filtrado por rol y condiciones dinámicas. Un solo punto de verdad para todas las superficies de navegación.

---

## Relación Frontend ↔ Backend

```
┌──────────────────────┐         ┌──────────────────────┐
│   AulaAlDía Frontend │  HTTP   │   AulaAlDía Backend  │
│   (React + Vite)     │────────▶│   (Django + DRF)     │
│                      │         │                      │
│  • SPA routing       │  JSON   │  • REST API /api/v1/ │
│  • JWT auth          │◀────────│  • JWT tokens        │
│  • X-Tenant-ID       │         │  • Multi-tenant      │
│  • Lazy pages        │         │  • PostgreSQL        │
└──────────────────────┘         └──────────────────────┘
        :5173                            :8000
```

El frontend NUNCA accede a la base de datos directamente. Toda la lógica de negocio, validación y autorización ocurre en el backend.
