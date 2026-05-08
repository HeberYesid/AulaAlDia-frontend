# 📊 Diagramas de Arquitectura

## 1. Árbol de Providers (Bootstrap)

El orden de los providers en `main.jsx` es crítico — cada provider depende del anterior:

```mermaid
graph TD
    A["React.StrictMode"] --> B{"GoogleOAuthProvider?"}
    B -->|"VITE_GOOGLE_CLIENT_ID definido"| C["GoogleOAuthProvider"]
    B -->|"No definido"| D["BrowserRouter"]
    C --> D
    D --> E["ThemeProvider"]
    E --> F["AuthProvider"]
    F --> G["TourProvider"]
    G --> H["App"]
```

> **¿Por qué este orden?** `ThemeProvider` es independiente. `AuthProvider` necesita el router para `api.js`. `TourProvider` necesita `AuthContext` para filtrar módulos por rol.

---

## 2. Flujo de Autenticación Completo

```mermaid
sequenceDiagram
    participant U as Usuario
    participant L as Login.jsx
    participant AC as AuthContext
    participant AX as axios.js
    participant API as Backend API

    U->>L: Ingresa credenciales
    L->>AC: login(email, password)
    AC->>API: POST /api/v1/auth/login/
    API-->>AC: { user, access, refresh, active_tenant_id }
    AC->>AC: saveAuth() → localStorage + state
    AC->>AX: setApiActiveTenantId(tenantId)
    AC-->>L: Autenticado ✓
    L->>U: Redirect → Dashboard

    Note over AX,API: Interceptor Request
    AX->>AX: Inyectar Authorization header
    AX->>AX: Inyectar X-Tenant-ID header

    Note over AX,API: Si recibe 401
    AX->>API: POST /api/v1/auth/token/refresh/
    API-->>AX: { access, active_tenant_id }
    AX->>AX: Actualizar token + reintentar request original

    Note over AX,API: Si refresh falla
    AX->>AX: Limpiar localStorage
    AX->>AC: Dispatch AUTH_INVALIDATED_EVENT
    AC->>U: Redirect → /login
```

---

## 3. Sistema de Routing y Guards

```mermaid
flowchart TD
    REQ["Request a una ruta protegida"] --> PR["ProtectedRoute"]
    
    PR --> AUTH{"¿user existe?"}
    AUTH -->|No| LOGIN["Redirect → /login"]
    AUTH -->|Sí| ROLE{"¿Tiene rol requerido?"}
    
    ROLE -->|No| HOME["Redirect → /"]
    ROLE -->|Sí| TENANT{"¿requireTenant?"}
    
    TENANT -->|No| SY{"¿requireActiveSchoolYear?"}
    TENANT -->|Sí| TCHECK{"¿Tenant activo\ny autorizado?"}
    
    TCHECK -->|No cargado| SPINNER1["Spinner: Validando..."]
    TCHECK -->|Sin tenant| REDIRECT1["Redirect → / con tenantRequired"]
    TCHECK -->|No autorizado| REDIRECT2["Redirect → / con tenantDenied"]
    TCHECK -->|✓ OK| SY
    
    SY -->|No| RENDER["✅ Renderizar children"]
    SY -->|Sí| SYCHECK{"¿Año escolar activo?"}
    
    SYCHECK -->|No cargado| SPINNER2["Spinner: Validando..."]
    SYCHECK -->|Sin año activo| GATE["🚫 Gate: Año escolar requerido"]
    SYCHECK -->|✓ OK| RENDER

    style LOGIN fill:#ef4444,color:#fff
    style HOME fill:#f59e0b,color:#fff
    style RENDER fill:#10b981,color:#fff
    style GATE fill:#ef4444,color:#fff
```

---

## 4. Arquitectura de Componentes (Vista de Capas)

```mermaid
graph TB
    subgraph "Capa de Presentación"
        PAGES["Pages<br/>(46 páginas)"]
        COMPONENTS["Components<br/>(20 componentes)"]
    end

    subgraph "Capa de Lógica"
        HOOKS["Custom Hooks<br/>(8 hooks)"]
        CONTEXTS["Contexts<br/>(Auth + Theme + Tour)"]
    end

    subgraph "Capa de Datos"
        API_LAYER["API Layer<br/>(axios + endpoints + services)"]
        UTILS["Utilities<br/>(toast, errors, navigation)"]
    end

    subgraph "Infraestructura"
        VITE["Vite Dev Server"]
        ROUTER["React Router"]
        AXIOS["Axios Interceptors"]
    end

    PAGES --> HOOKS
    PAGES --> COMPONENTS
    PAGES --> CONTEXTS
    PAGES --> UTILS
    COMPONENTS --> CONTEXTS
    HOOKS --> API_LAYER
    HOOKS --> UTILS
    API_LAYER --> AXIOS
    CONTEXTS --> API_LAYER

    style PAGES fill:#3b82f6,color:#fff
    style COMPONENTS fill:#6366f1,color:#fff
    style HOOKS fill:#8b5cf6,color:#fff
    style CONTEXTS fill:#a855f7,color:#fff
    style API_LAYER fill:#ec4899,color:#fff
    style UTILS fill:#f43f5e,color:#fff
```

---

## 5. Flujo Multi-Tenant

```mermaid
sequenceDiagram
    participant U as Usuario
    participant AC as AuthContext
    participant SB as Sidebar
    participant API as Backend

    Note over AC: Al hacer login
    AC->>API: GET /api/v1/auth/my-tenants/
    API-->>AC: { tenants: [...], active_tenant_id }
    AC->>AC: setTenants() + setActiveTenantId()
    AC->>AC: applyBrandingToDocument()
    Note over AC: CSS vars: --primary, --accent,<br/>--primary-light, --primary-dark

    U->>SB: Selecciona otro tenant
    SB->>AC: switchTenant(tenantId)
    AC->>API: POST /api/v1/auth/select-tenant/
    API-->>AC: { access, refresh, active_tenant_id }
    AC->>AC: mergeAuthState() + refreshMe()
    AC->>AC: applyBrandingToDocument() con nuevo branding
    AC->>API: GET /api/v1/courses/active-school-year-status/
    Note over AC: Toda la app refleja el nuevo tenant
```

---

## 6. Mapa de Módulos de Página por Rol

```mermaid
graph LR
    subgraph "Público"
        PUB_HOME["Home"]
        PUB_FAQ["FAQ"]
        PUB_CONTACT["Contact"]
        PUB_LEGAL["Legal Pages"]
    end

    subgraph "Auth Flow"
        AUTH_LOGIN["Login"]
        AUTH_REG["Register<br/>Student/Teacher/Tutor"]
        AUTH_VERIFY["VerifyCode"]
        AUTH_RESET["ForgotPassword<br/>ResetPassword"]
    end

    subgraph "ADMIN"
        ADM_DASH["Admin Dashboard"]
        ADM_NEWS["Novedades"]
        ADM_USERS["Usuarios"]
        ADM_ACADEMIC["Config. Académica"]
        ADM_AUDIT["Auditoría"]
        ADM_SUPPORT["Soporte"]
        ADM_BULLETINS["Boletines"]
        ADM_ATTENDANCE["Asistencia Docente"]
        ADM_CURRICULUM["Mallas / Grados /<br/>Secciones / Cursos"]
        ADM_COMMERCIAL["Comercial<br/>(global admin)"]
    end

    subgraph "TEACHER"
        TCH_DASH["Dashboard"]
        TCH_SUBJECTS["Materias"]
        TCH_DETAIL["Detalle Materia"]
        TCH_EVALS["Eval. Docente"]
        TCH_ATT["Historial Asistencia"]
    end

    subgraph "STUDENT"
        STU_DASH["Dashboard"]
        STU_RESULTS["Resultados"]
        STU_SUBJECTS["Mis Materias"]
        STU_BULLETINS["Boletines"]
        STU_EVALS["Eval. Docente"]
    end

    subgraph "Compartidos"
        SHARED_CALENDAR["Calendario"]
        SHARED_SCHEDULES["Horarios"]
        SHARED_OBSERVER["Observador"]
        SHARED_ABSENCES["Asistencia"]
        SHARED_MESSAGES["Mensajes"]
        SHARED_NOTIF["Notificaciones"]
        SHARED_PROFILE["Perfil"]
    end

    style ADMIN fill:#ef4444,color:#fff
    style TEACHER fill:#3b82f6,color:#fff
    style STUDENT fill:#10b981,color:#fff
    style Compartidos fill:#8b5cf6,color:#fff
```

---

## 7. Flujo de Token Refresh (Interceptor)

```mermaid
statechart-v2
```

```mermaid
flowchart TD
    REQ["API Request"] --> RESP{"Response Status?"}
    
    RESP -->|"200-299"| OK["✅ Retornar response"]
    RESP -->|"401 + no retry"| CHECK{"¿Hay refresh token?"}
    RESP -->|"Otro error"| ERR["❌ Reject con userMessage"]
    
    CHECK -->|No| ERR
    CHECK -->|Sí| REFRESHING{"¿isRefreshing?"}
    
    REFRESHING -->|Sí| QUEUE["Encolar en pending[]<br/>Esperar nuevo token"]
    REFRESHING -->|No| REFRESH["POST /token/refresh/"]
    
    REFRESH --> RESULT{"¿Refresh exitoso?"}
    
    RESULT -->|Sí| UPDATE["Actualizar tokens<br/>en localStorage"]
    UPDATE --> FLUSH["Ejecutar cola pending[]<br/>con nuevo token"]
    FLUSH --> RETRY["Reintentar request original"]
    
    RESULT -->|No| INVALIDATE["Limpiar auth<br/>Dispatch AUTH_INVALIDATED"]
    INVALIDATE --> LOGOUT["→ /login"]
    
    QUEUE --> RETRY

    style OK fill:#10b981,color:#fff
    style ERR fill:#ef4444,color:#fff
    style LOGOUT fill:#ef4444,color:#fff
```

---

## 8. Layout Visual de la App

```
┌─────────────────────────────────────────────────────┐
│  [☰]  (Mobile hamburger — solo visible en mobile)   │
├────────────┬────────────────────────────────────────┤
│            │  [Skip Link → #main-content]           │
│            │                                        │
│  SIDEBAR   │  ContextualTipBanner                   │
│            │  ┌──────────────────────────────────┐  │
│  • Brand   │  │                                  │  │
│  • Nav     │  │     <Routes>                     │  │
│    sections│  │     (Lazy-loaded pages)           │  │
│  ─────────│  │                                  │  │
│  • 🔔     │  │     Wrapped in:                   │  │
│  • 👤     │  │     - ErrorBoundary               │  │
│  • 🚪     │  │     - Suspense                    │  │
│            │  │                                  │  │
│            │  └──────────────────────────────────┘  │
├────────────┴────────────────────────────────────────┤
│  AppTour (Suspense, lazy — overlay cuando activo)   │
└─────────────────────────────────────────────────────┘
```

- El **Sidebar** se oculta cuando `user === null` (páginas públicas y auth)
- En mobile, el Sidebar es un drawer con overlay
- En desktop, el Sidebar se puede colapsar (estado persistido en localStorage)
