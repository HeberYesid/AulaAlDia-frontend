# 🔧 Utilidades y Constantes

Funciones puras y valores estáticos ubicados en `src/utils/` y `src/constants/`. Sin dependencia de React — se pueden usar en cualquier contexto.

---

## `utils/navigation.js` — Configuración de Navegación

El archivo más grande de utilidades (~16KB). Define **toda la navegación** de la app como un array de objetos.

### Exports principales

| Función | Retorna | Uso |
|---------|---------|-----|
| `getNavigationItems(user, { surface })` | `Item[]` | Items filtrados por rol y superficie (sidebar/navbar) |
| `getNavigationSections(user, options)` | `Section[]` | Items agrupados por sección con label |
| `getContextualTipByPath(user, pathname)` | `string \| null` | Tip contextual para la ruta actual |
| `getOnboardingNavigationItems(user)` | `Item[]` | Items con `tourId` para el onboarding |

### Secciones

```javascript
export const NAVIGATION_SECTIONS = [
  { id: 'general', label: 'General' },
  { id: 'administration', label: 'Administracion' },
  { id: 'academic', label: 'Academico' },
  { id: 'communication', label: 'Comunicacion' },
]
```

Ver [Routing y Navegación](../02-guides/02-routing.md) para la estructura completa de items.

---

## `utils/apiErrorMessage.js` — Manejo de Errores API

Extracción inteligente de mensajes user-friendly desde errores Axios.

### Export principal

```javascript
getApiErrorMessage(error, { action, fallback })
```

### Pipeline de extracción

```
1. ¿Timeout? (ECONNABORTED) → "No se pudo {action} porque el servidor tardó..."
2. ¿Network Error? → "No se pudo {action} porque no hay conexión..."
3. ¿Hay payload? → Extraer de: detail > error > message > non_field_errors > campos
   3a. ¿Es HTML/traceback técnico? → Filtrar, usar status fallback
   3b. ¿Es mensaje genérico? → Prefixar con "No se pudo {action}..."
   3c. Mensaje específico → Retornar directo
4. ¿Status HTTP conocido? → Mensaje por status (400, 401, 403, 404, 409, 429, 5xx)
5. Fallback proporcionado → Retornar fallback
6. Default → "No se pudo {action}. Intentalo nuevamente."
```

### Labels de campos

Los errores de validación por campo se traducen automáticamente:

```javascript
const FIELD_LABELS = {
  email: 'correo',
  student_email: 'correo del estudiante',
  invitation_code: 'codigo de invitacion',
  turnstile_token: 'verificacion de seguridad',
  password: 'contrasena',
  current_password: 'contrasena actual',
  new_password: 'nueva contrasena',
  session_timeout: 'tiempo de sesion',
}
```

---

## `utils/toast.js` — Sistema de Notificaciones

Sistema de toasts vanilla (sin dependencia de React) que inyecta elementos directamente en el DOM.

### API

```javascript
import toast from '../utils/toast'

// Shortcuts por tipo
toast.success('Materia creada exitosamente')
toast.error('No se pudo guardar')
toast.warning('El periodo está por cerrar')
toast.info('Nueva versión disponible')
toast.security('Contraseña actualizada')

// Versión completa
import { showToast } from '../utils/toast'

showToast({
  type: 'success',        // success | error | warning | info | security
  title: 'Título custom', // Opcional — usa default del tipo
  message: 'Contenido principal',
  subtitle: 'Info adicional',  // Opcional
  duration: 5000,          // ms, 0 = sin auto-close
  closable: true,          // Botón de cerrar
})
```

### Tipos de toast

| Tipo | Icono | Color |
|------|-------|-------|
| `success` | ✅ | Verde (#10b981 → #059669) |
| `error` | ❌ | Rojo (#ef4444 → #dc2626) |
| `warning` | ⚠️ | Amarillo (#f59e0b → #d97706) |
| `info` | ℹ️ | Azul (#3b82f6 → #2563eb) |
| `security` | 🔐 | Púrpura (#667eea → #764ba2) |

### Función especial

```javascript
import { showPasswordChangeToast } from '../utils/toast'
showPasswordChangeToast() // Toast preconfigurado para cambio de contraseña
```

---

## `utils/constants.js` — Constantes de la App

```javascript
export const API_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión con el servidor...',
  GENERIC_ERROR: 'Ha ocurrido un error inesperado...',
  UNAUTHORIZED: 'Credenciales inválidas o sesión expirada.',
  FORBIDDEN: 'No tienes permisos para realizar esta acción.',
  NOT_FOUND: 'El recurso solicitado no se encuentra disponible.',
}

export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'Este campo es obligatorio.',
  INVALID_EMAIL: 'Ingresa un correo electrónico válido.',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres.',
  PASSWORDS_MUST_MATCH: 'Las contraseñas no coinciden.',
}

export const APP_CONFIG = {
  MIN_PASSWORD_LENGTH: 8,
  TURNSTILE_SITE_KEY: import.meta.env.VITE_TURNSTILE_SITE_KEY || '',
  SUPPORT_EMAIL: 'soporte@aulaaldia.com',
}

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  TUTOR: 'TUTOR',
}
```

---

## `utils/branding.js` — Helpers de Branding

```javascript
getBrandInitials(brandName) // 'AulaAlDía' → 'AD', 'Mi Colegio' → 'MC'
```

Usado por el Sidebar cuando no hay logo de tenant para mostrar iniciales como fallback.

---

## `utils/markdown.js` — Renderizado Seguro de Markdown

```javascript
import { renderMarkdown } from '../utils/markdown'

const html = renderMarkdown(markdownString)
// Usa `marked` para parsear + `DOMPurify` para sanitizar
```

---

## `utils/pagination.js` — Helpers de Paginación

Constantes y helpers para manejar paginación de listas.

---

## `utils/academicPeriodPresentation.js` — Formato de Periodos

```javascript
formatAcademicPeriod(period) // { label: 'P1', name: 'Primer Periodo' } → 'P1 - Primer Periodo'
```

---

## `constants/legalContact.js` — Contacto Legal

Información de contacto legal de la plataforma (email, teléfono).

---

## `constants/legalLinks.js` — Links Legales

```javascript
export const LEGAL_LINKS = [
  { to: '/privacy', label: 'Aviso de Privacidad' },
  { to: '/terms', label: 'Términos y Condiciones' },
  { to: '/habeas-data', label: 'Habeas Data' },
]
```

Usado por footer y formularios de registro para mostrar links de forma consistente.
