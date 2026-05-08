# 🧭 Routing y Navegación

## Tabla de Rutas Completa

### Rutas Públicas

| Ruta | Página | Layout | Descripción |
|------|--------|--------|-------------|
| `/home` | `Home` | `PublicLayout` | Landing page principal |
| `/faq` | `FAQ` | `PublicLayout` | Preguntas frecuentes |
| `/contact` | `Contact` | `PublicLayout` | Formulario de contacto |
| `/privacy` | `LegalNotice` | `PublicLayout` | Aviso de privacidad |
| `/terms` | `TermsConditions` | `PublicLayout` | Términos y condiciones |
| `/habeas-data` | `HabeasData` | `PublicLayout` | Política de datos personales |
| `/pqrs` | `Pqrs` | `PublicLayout` | Peticiones, quejas, reclamos |

### Rutas de Autenticación (sin sidebar)

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/login` | `Login` | Inicio de sesión (email + Google) |
| `/register` | `Register` | Registro de estudiantes |
| `/register-teacher` | `RegisterTeacher` | Registro de docentes |
| `/register-tutor` | `RegisterTutor` | Registro de acudientes |
| `/verify` | Redirect → `/verify-code` | Legacy redirect |
| `/verify-code` | `VerifyCode` | Verificación de código por email |
| `/forgot-password` | `ForgotPassword` | Solicitar reset de contraseña |
| `/reset-password` | `ResetPassword` | Formulario de nueva contraseña |

### Rutas Protegidas — Todos los Roles

| Ruta | Página | Roles | Guards Extra |
|------|--------|-------|-------------|
| `/` | `Dashboard` | Todos | `requireActiveSchoolYear` |
| `/dashboard` | `Dashboard` | Todos | `requireActiveSchoolYear` |
| `/complete-registration` | `CompleteRegistration` | Todos | Solo auth |
| `/profile` | `UserProfile` | Todos | Solo auth |
| `/notifications` | `Notifications` | Todos | `requireTenant` + `requireActiveSchoolYear` |
| `/calendar` | `Calendar` | Todos | `requireTenant` + `requireActiveSchoolYear` |
| `/schedules` | `Schedules` | Todos | `requireTenant` + `requireActiveSchoolYear` |
| `/observer` | `Observer` | Todos | `requireTenant` + `requireActiveSchoolYear` |
| `/absences` | `Absences` | Todos | `requireTenant` + `requireActiveSchoolYear` |
| `/messages` | `Messages` | Todos | `requireTenant` |
| `/messages/:conversationId` | `Messages` | Todos | `requireTenant` |

### Rutas Protegidas — ADMIN

| Ruta | Página | Guards |
|------|--------|--------|
| `/admin/dashboard` | `AdminDashboard` | `requireTenant` + `requireActiveSchoolYear` |
| `/admin/news` | `AdminNews` | `requireTenant` + `requireActiveSchoolYear` |
| `/admin/support` | `AdminSupportTickets` | `requireTenant` |
| `/admin/operations` | `TenantOperationsAudit` | `requireTenant` |
| `/admin/users` | `AdminUsers` | `requireTenant` |
| `/admin/academic-settings` | `AcademicSettings` | `requireTenant` |
| `/admin/commercial` | `TenantCommercialAdmin` | Solo `ADMIN` (global admin) |
| `/admin/bulletins` | `AdminBulletins` | `requireTenant` + `requireActiveSchoolYear` |
| `/admin/teacher-attendance` | `AdminTeacherAttendance` | `requireTenant` + `requireActiveSchoolYear` |
| `/admin/grade-levels` | `GradeLevels` | `requireTenant` + `requireActiveSchoolYear` |
| `/admin/sections` | `Sections` | `requireTenant` + `requireActiveSchoolYear` |
| `/admin/courses` | `Courses` | `requireTenant` + `requireActiveSchoolYear` |
| `/admin/curriculums` | `Curriculums` | `requireTenant` + `requireActiveSchoolYear` |

### Rutas Protegidas — TEACHER

| Ruta | Página | Guards |
|------|--------|--------|
| `/subjects` | `Subjects` | `requireTenant` + `requireActiveSchoolYear` |
| `/subjects/:id` | `SubjectDetail` | `requireTenant` + `requireActiveSchoolYear` |
| `/subjects/:subjectId/exercises/:exerciseId` | `ExerciseDetail` | `requireTenant` + `requireActiveSchoolYear` |
| `/teacher-evaluations` | `TeacherEvaluations` | `requireTenant` + `requireActiveSchoolYear` |
| `/teacher-attendance/history` | `MyTeacherAttendanceHistory` | `requireTenant` + `requireActiveSchoolYear` |

### Rutas Protegidas — STUDENT / TUTOR

| Ruta | Página | Roles | Guards |
|------|--------|-------|--------|
| `/my` | `MyResults` | STUDENT, TUTOR | `requireTenant` + `requireActiveSchoolYear` |
| `/my-subjects` | `MySubjects` | STUDENT, TUTOR | `requireTenant` + `requireActiveSchoolYear` |
| `/my-bulletins` | `MyBulletins` | STUDENT, TUTOR | `requireTenant` + `requireActiveSchoolYear` |
| `/teacher-evaluations` | `TeacherEvaluations` | STUDENT | `requireTenant` + `requireActiveSchoolYear` |

### Fallback

| Ruta | Comportamiento |
|------|---------------|
| `*` (cualquier otra) | `Navigate → /` (redirect al dashboard) |

---

## Sistema de Guards (`ProtectedRoute`)

El componente `ProtectedRoute` soporta las siguientes props:

```jsx
<ProtectedRoute
  roles={["ADMIN", "TEACHER"]}       // Roles permitidos (opcional)
  requireTenant                        // Requiere tenant activo
  requireActiveSchoolYear              // Requiere año escolar activo
  activeSchoolYearExemptRoles={[]}     // Roles exentos del gate de año escolar
>
  <Page />
</ProtectedRoute>
```

### Lógica de evaluación (en orden):

1. **Auth check**: Si `user` es null → redirect a `/login` (guardando `location` en state para volver después)
2. **Role check**: Si `roles` está definido y el usuario no tiene uno → redirect a `/`
3. **Tenant check** (si `requireTenant`): Verifica que el usuario tenga un tenant activo y autorizado
4. **School year check** (si `requireActiveSchoolYear`): Verifica que exista un año escolar activo. Si no, muestra un gate con link a configuración (admin) o mensaje informativo (otros roles)

---

## Navegación Data-Driven

Toda la navegación se genera desde `src/utils/navigation.js`:

```javascript
// Estructura de un item de navegación
{
  key: 'subjects',              // ID único
  to: '/subjects',              // Ruta
  label: 'Materias',            // Texto (puede ser función: (user) => string)
  icon: BookOpenText,           // Componente Lucide
  section: 'academic',          // Sección: general | administration | academic | communication
  roles: ['TEACHER', 'ADMIN'], // Roles que pueden ver este item
  when: (user) => boolean,     // Condición dinámica adicional (opcional)
  showInNavbar: false,         // Excluir del navbar (opcional)
  tourId: 'nav-subjects',     // ID para el tour onboarding
  contextualTip: '...',        // Tip que se muestra en ContextualTipBanner
  onboarding: {                 // Config del tour para esta página
    internalTarget: '.data-table',
    internalDescription: '...',
  },
}
```

### Secciones de navegación

| ID | Label | Descripción |
|----|-------|-------------|
| `general` | General | Dashboard |
| `administration` | Administración | Novedades, soporte, auditoría, usuarios, config |
| `academic` | Académico | Materias, resultados, calendario, observador |
| `communication` | Comunicación | Mensajes |

### Funciones exportadas

| Función | Uso |
|---------|-----|
| `getNavigationItems(user, { surface })` | Items filtrados por rol para sidebar o navbar |
| `getNavigationSections(user, options)` | Items agrupados por sección |
| `getContextualTipByPath(user, pathname)` | Tip contextual para la ruta actual |
| `getOnboardingNavigationItems(user)` | Items con `tourId` para el tour onboarding |
