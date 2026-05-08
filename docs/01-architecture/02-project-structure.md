# 📁 Estructura del Proyecto

## Árbol de Directorios

```
AulaAlDia-Frontend/
├── public/                          # Assets estáticos (favicon, manifest)
├── e2e/                             # Tests E2E con Playwright
│   └── 01_home.spec.js
├── src/
│   ├── main.jsx                     # Bootstrap: providers + render
│   ├── App.jsx                      # Shell principal: Sidebar + Routes
│   ├── styles.css                   # CSS global (~186KB, design system completo)
│   ├── styles/
│   │   ├── markdown.css             # Estilos para contenido markdown renderizado
│   │   └── inline-style-governance.md
│   │
│   ├── api/                         # 🔌 Capa HTTP
│   │   ├── axios.js                 # Instancia Axios, interceptores, refresh
│   │   ├── endpoints.js             # Mapa centralizado de endpoints API
│   │   ├── contact.js               # API de contacto
│   │   ├── errors.js                # Helpers de errores API
│   │   ├── messaging.js             # API de mensajería
│   │   ├── notifications.js         # API de notificaciones
│   │   ├── supportTickets.js        # API de tickets de soporte
│   │   ├── users.js                 # API de usuarios
│   │   └── __tests__/               # Tests de la capa API
│   │
│   ├── state/                       # 🧠 Estado global (React Context)
│   │   ├── AuthContext.jsx          # Autenticación, tokens, tenants, branding
│   │   ├── ThemeContext.jsx         # Dark/Light theme
│   │   ├── TourContext.jsx          # Onboarding tour guiado
│   │   └── __tests__/
│   │
│   ├── components/                  # 🧩 Componentes reutilizables
│   │   ├── Sidebar.jsx              # Navegación principal lateral
│   │   ├── NavBar.jsx               # Barra superior (mobile)
│   │   ├── PublicNavBar.jsx         # Navbar para páginas públicas
│   │   ├── PublicLayout.jsx         # Layout wrapper para rutas públicas
│   │   ├── ProtectedRoute.jsx       # Guard: auth + roles + tenant + school year
│   │   ├── NotificationBell.jsx     # Campanita con polling de notificaciones
│   │   ├── ConfirmDialog.jsx        # Modal de confirmación reutilizable
│   │   ├── Alert.jsx                # Componente de alerta inline
│   │   ├── StatCard.jsx             # Tarjeta de estadística para dashboards
│   │   ├── StatusBadge.jsx          # Badge de estado (activo, inactivo, etc.)
│   │   ├── SchoolHeader.jsx         # Header con info del colegio
│   │   ├── ThemeToggle.jsx          # Toggle dark/light
│   │   ├── AppTour.jsx              # Componente de tour onboarding
│   │   ├── ContextualTipBanner.jsx  # Banner con tips contextuales por ruta
│   │   ├── WelcomePanel.jsx         # Panel de bienvenida en dashboard
│   │   ├── SidebarBanner.jsx        # Banner promocional en sidebar
│   │   ├── CSVUpload.jsx            # Upload de archivos CSV
│   │   ├── HierarchicalSelector.jsx # Selector jerárquico (grado → sección → curso)
│   │   ├── LegalConsentField.jsx    # Checkbox de consentimiento legal
│   │   ├── TurnstileCaptcha.jsx     # Integración Cloudflare Turnstile
│   │   └── __tests__/
│   │
│   ├── pages/                       # 📄 Páginas (route-level components)
│   │   ├── Home.jsx                 # Landing pública
│   │   ├── Login.jsx                # Inicio de sesión
│   │   ├── Register.jsx             # Registro de estudiantes
│   │   ├── RegisterTeacher.jsx      # Registro de docentes
│   │   ├── RegisterTutor.jsx        # Registro de acudientes
│   │   ├── CompleteRegistration.jsx # Completar perfil post-Google
│   │   ├── VerifyCode.jsx           # Verificación de código email
│   │   ├── ForgotPassword.jsx       # Solicitud de reset de contraseña
│   │   ├── ResetPassword.jsx        # Formulario de nueva contraseña
│   │   ├── Dashboard.jsx            # Dashboard principal (Teacher/Student/Tutor)
│   │   ├── AdminDashboard.jsx       # Dashboard administrativo
│   │   ├── StudentDashboard.jsx     # Vista de dashboard para estudiantes
│   │   ├── Subjects.jsx             # Listado de materias
│   │   ├── SubjectDetail/           # Detalle de materia (tabs)
│   │   │   ├── index.jsx            # Componente principal con tabs
│   │   │   ├── ExercisesTab.jsx     # Tab de ejercicios
│   │   │   ├── StudentsTab.jsx      # Tab de estudiantes
│   │   │   └── ResultsTab.jsx       # Tab de resultados/calificaciones
│   │   ├── ExerciseDetail/          # Detalle de ejercicio
│   │   │   ├── index.jsx
│   │   │   ├── StudentSubmissionSection.jsx
│   │   │   └── TeacherSubmissionsSection.jsx
│   │   ├── curriculums/             # Módulo curricular (admin)
│   │   │   ├── Curriculums.jsx      # Mallas curriculares
│   │   │   ├── GradeLevels.jsx      # Grados
│   │   │   ├── Sections.jsx         # Secciones
│   │   │   └── Courses.jsx          # Cursos
│   │   ├── messaging/               # Módulo de mensajería
│   │   │   ├── Messages.jsx         # Página principal de mensajes
│   │   │   ├── ConversationList.jsx # Lista de conversaciones
│   │   │   ├── ChatWindow.jsx       # Ventana de chat
│   │   │   ├── MessageBubble.jsx    # Burbuja individual de mensaje
│   │   │   ├── NewChatModal.jsx     # Modal para iniciar conversación
│   │   │   ├── EmptyState.jsx       # Estado vacío de mensajes
│   │   │   └── Messages.css
│   │   ├── MyResults.jsx            # Resultados del estudiante
│   │   ├── MySubjects.jsx           # Materias del estudiante
│   │   ├── MyBulletins.jsx          # Boletines del estudiante
│   │   ├── TeacherEvaluations.jsx   # Evaluaciones docentes
│   │   ├── Observer.jsx             # Observador académico
│   │   ├── Absences.jsx             # Control de asistencia
│   │   ├── Calendar.jsx             # Calendario académico
│   │   ├── Schedules.jsx            # Horarios
│   │   ├── Notifications.jsx        # Centro de notificaciones
│   │   ├── UserProfile.jsx          # Perfil de usuario
│   │   ├── AdminNews.jsx            # Gestión de novedades (admin)
│   │   ├── AdminUsers.jsx           # Gestión de usuarios (admin)
│   │   ├── AdminBulletins.jsx       # Boletines institucionales (admin)
│   │   ├── AdminSupportTickets.jsx  # Tickets de soporte (admin)
│   │   ├── AdminTeacherAttendance.jsx # Asistencia docente (admin)
│   │   ├── MyTeacherAttendanceHistory.jsx # Historial asistencia (teacher)
│   │   ├── AcademicSettings.jsx     # Config. académica (admin)
│   │   ├── TenantOperationsAudit.jsx # Auditoría operacional (admin)
│   │   ├── TenantCommercialAdmin.jsx # Administración comercial (global admin)
│   │   ├── FAQ.jsx                  # Preguntas frecuentes (pública)
│   │   ├── Contact.jsx              # Formulario de contacto (pública)
│   │   ├── LegalNotice.jsx          # Aviso legal (pública)
│   │   ├── TermsConditions.jsx      # Términos y condiciones (pública)
│   │   ├── HabeasData.jsx           # Política de datos (pública)
│   │   ├── Pqrs.jsx                 # PQRS (pública)
│   │   ├── Verify.jsx               # Legacy redirect → /verify-code
│   │   └── __tests__/               # 37 archivos de test
│   │
│   ├── hooks/                       # 🪝 Custom Hooks
│   │   ├── useAcademicSettings.js   # Lógica de configuración académica
│   │   ├── useAdminDashboardData.js # Datos del dashboard admin
│   │   ├── useObservations.js       # CRUD de observaciones
│   │   ├── useSchedules.js          # Lógica de horarios
│   │   ├── useStudentSearch.js      # Búsqueda de estudiantes
│   │   ├── useSupportTickets.js     # CRUD de tickets
│   │   ├── useTeacherAttendance.js  # Asistencia docente
│   │   ├── useTenantUsers.js        # Gestión de usuarios del tenant
│   │   └── __tests__/
│   │
│   ├── utils/                       # 🔧 Utilidades
│   │   ├── navigation.js            # Configuración centralizada de navegación
│   │   ├── apiErrorMessage.js       # Extracción inteligente de errores API
│   │   ├── toast.js                 # Sistema de notificaciones toast
│   │   ├── constants.js             # Constantes de la app (roles, mensajes)
│   │   ├── branding.js              # Helpers de branding (initials)
│   │   ├── markdown.js              # Renderizado seguro de markdown
│   │   ├── pagination.js            # Helpers de paginación
│   │   ├── academicPeriodPresentation.js # Formato de periodos académicos
│   │   └── __tests__/
│   │
│   ├── constants/                   # 📋 Constantes de dominio
│   │   ├── legalContact.js          # Info de contacto legal
│   │   └── legalLinks.js            # Links a páginas legales
│   │
│   ├── tour/                        # 🎯 Configuración del tour
│   │   └── (vacío — config en TourContext + navigation.js)
│   │
│   ├── integration/                 # 🔗 Tests de integración
│   │   ├── auth-protected-route.integration.test.jsx
│   │   └── notification-bell.integration.test.jsx
│   │
│   └── test/                        # ⚙️ Configuración de tests
│       ├── setup.js                 # Setup global de Vitest
│       └── utils.jsx                # Helpers para tests (render con providers)
│
├── .env.example                     # Variables de entorno de ejemplo
├── index.html                       # Punto de entrada HTML
├── vite.config.js                   # Configuración de Vite
├── vitest.config.js                 # Configuración de Vitest
├── eslint.config.js                 # Configuración de ESLint
├── playwright.config.js             # Configuración de Playwright
├── nginx.conf                       # Config Nginx para producción
├── vercel.json                      # Config de deployment Vercel
├── package.json                     # Dependencias y scripts
├── DESIGN.md                        # Design system (Notion-inspired)
└── CONTRIBUTING.md                  # Guía de contribución
```

---

## Convenciones de Archivos

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Componentes | `PascalCase.jsx` | `Sidebar.jsx`, `NotificationBell.jsx` |
| Hooks | `camelCase` con prefijo `use` | `useAcademicSettings.js` |
| Utilidades | `camelCase.js` | `apiErrorMessage.js`, `toast.js` |
| Constantes | `camelCase.js` con exports `UPPER_SNAKE_CASE` | `constants.js` → `USER_ROLES` |
| Tests | `*.test.jsx` en carpeta `__tests__/` | `Login.test.jsx` |
| Tests de integración | `*.integration.test.jsx` en `integration/` | `auth-protected-route.integration.test.jsx` |
| Estilos colocados | `ComponentName.css` junto al componente | `AdminNews.css` |
| Páginas compuestas | Carpeta con `index.jsx` + sub-componentes | `SubjectDetail/index.jsx` |

---

## Principio de Organización

```
src/
├── api/         → HOW we talk to the backend (HTTP layer)
├── state/       → WHAT we remember globally (React Context)
├── hooks/       → REUSABLE logic extracted from pages
├── utils/       → PURE functions with no React dependency
├── constants/   → STATIC values used across the app
├── components/  → REUSABLE UI pieces (cross-page)
└── pages/       → ROUTE-LEVEL screens (one per URL)
```

> **Regla clave**: Si algo se usa en más de una página → `components/` o `hooks/`. Si solo se usa en una página y es complejo → subcarpeta dentro de `pages/` (e.g., `SubjectDetail/`).
