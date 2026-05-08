# 🔌 Capa API y Axios

## Arquitectura de la Capa HTTP

```
src/api/
├── axios.js           # Instancia Axios + interceptores
├── endpoints.js       # Mapa centralizado de URLs
├── contact.js         # Service: contacto
├── errors.js          # Helpers de errores
├── messaging.js       # Service: mensajería
├── notifications.js   # Service: notificaciones
├── supportTickets.js  # Service: tickets de soporte
└── users.js           # Service: usuarios
```

---

## Instancia Axios (`axios.js`)

### Configuración Base

```javascript
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,  // 30 segundos
})
```

### Interceptor de Request

Cada request que sale por `api` recibe automáticamente:

1. **Authorization header**: `Bearer {access_token}` (si hay token en localStorage)
2. **X-Tenant-ID header**: ID del tenant activo (si existe)

```javascript
api.interceptors.request.use((config) => {
  // 1. Resolver tenant ID
  const activeTenantId = getActiveTenantId()
  if (activeTenantId) {
    config.headers['X-Tenant-ID'] = activeTenantId
  }

  // 2. Adjuntar JWT
  const auth = getTokens()
  if (auth?.access) {
    config.headers['Authorization'] = `Bearer ${auth.access}`
  }

  return config
})
```

### Interceptor de Response — Token Refresh

El interceptor de response implementa **refresh silencioso** con cola de requests:

```
Request → 401 → ¿Tiene refresh token?
                   ├── No → Reject con error
                   └── Sí → ¿Refresh en curso?
                              ├── Sí → Encolar request (pending[])
                              └── No → POST /token/refresh/
                                         ├── Éxito → Actualizar token
                                         │           Ejecutar cola
                                         │           Reintentar original
                                         └── Fallo → Limpiar auth
                                                      Dispatch AUTH_INVALIDATED
```

**Características clave**:
- `isRefreshing` flag evita múltiples refreshes simultáneos
- `pending[]` almacena callbacks de requests que esperan el nuevo token
- Si el refresh falla, se limpia `localStorage` y se dispara `AUTH_INVALIDATED_EVENT`
- Cada error recibe un `userMessage` human-friendly via `attachUserMessage()`

### Evento de Invalidación

```javascript
export const AUTH_INVALIDATED_EVENT = 'aulaaldia:auth-invalidated'
```

`AuthContext` escucha este evento para ejecutar `logout()` automáticamente cuando el refresh falla.

---

## Endpoints Centralizados (`endpoints.js`)

```javascript
export const API_ENDPOINTS = Object.freeze({
  auth: {
    tokenRefresh: '/api/v1/auth/token/refresh/',
  },
  courses: {
    notifications: {
      base: '/api/v1/courses/notifications/',
      unreadCount: '/api/v1/courses/notifications/unread-count/',
      markAllRead: '/api/v1/courses/notifications/mark-all-read/',
      deleteAll: '/api/v1/courses/notifications/delete-all/',
      byId: (id) => `/api/v1/courses/notifications/${id}/`,
      markRead: (id) => `/api/v1/courses/notifications/${id}/mark-read/`,
    },
  },
  messaging: {
    conversations: '/api/v1/messaging/conversations/',
    conversationById: (id) => `/api/v1/messaging/conversations/${id}/`,
    startConversation: '/api/v1/messaging/conversations/start/',
    readAll: (id) => `/api/v1/messaging/conversations/${id}/read_all/`,
    messages: '/api/v1/messaging/messages/',
    messagesByConversation: (id) => `/api/v1/messaging/messages/?conversation=${id}`,
    usersSearch: (query) => `/api/v1/messaging/users/?search=${query}`,
  },
})
```

> **Nota**: No todos los endpoints están centralizados aquí. Muchas páginas construyen URLs directamente (e.g., `/api/v1/courses/subjects/`). El mapa centralizado cubre los más reutilizados.

---

## Servicios API

Cada archivo de servicio exporta funciones que encapsulan calls API:

### Patrón típico

```javascript
// src/api/notifications.js
import { api } from './axios'
import { API_ENDPOINTS } from './endpoints'

export async function getNotifications(params) {
  const { data } = await api.get(API_ENDPOINTS.courses.notifications.base, { params })
  return data
}

export async function markNotificationRead(id) {
  const { data } = await api.patch(API_ENDPOINTS.courses.notifications.markRead(id))
  return data
}
```

### Servicios disponibles

| Servicio | Archivo | Operaciones |
|----------|---------|-------------|
| **Contacto** | `contact.js` | Enviar formulario de contacto |
| **Errores** | `errors.js` | Helpers de manejo de errores |
| **Mensajería** | `messaging.js` | CRUD de conversaciones y mensajes |
| **Notificaciones** | `notifications.js` | Listar, marcar leída, eliminar |
| **Tickets** | `supportTickets.js` | CRUD de tickets de soporte |
| **Usuarios** | `users.js` | Búsqueda y gestión de usuarios |

---

## Manejo de Errores API

### `getApiErrorMessage(error, options)`

Función inteligente que extrae mensajes user-friendly de errores Axios:

```javascript
import { getApiErrorMessage } from '../utils/apiErrorMessage'

try {
  await api.post('/api/v1/courses/subjects/', payload)
} catch (error) {
  const message = getApiErrorMessage(error, {
    action: 'crear la materia',  // Contexto para el mensaje
    fallback: 'Ocurrió un error inesperado',
  })
  toast.error(message)
}
```

### Lógica de extracción (en orden de prioridad)

1. **Connection errors**: `ECONNABORTED` (timeout) o `Network Error` → mensaje de conexión
2. **Payload extraction**: Busca en `response.data` los campos: `detail`, `error`, `message`, `non_field_errors`
3. **Field-level errors**: Si hay errores por campo (e.g., `{ email: ["Este campo es obligatorio"] }`), los formatea con labels humanos
4. **Status fallback**: Si el payload no tiene mensaje útil, genera uno basado en el status HTTP (400, 401, 403, 404, 409, 429, 5xx)
5. **Filtros de seguridad**: Detecta y filtra HTML de Django debug pages y tracebacks técnicos

### `error.userMessage`

El interceptor de response adjunta automáticamente un `userMessage` a cada error, usando `getApiErrorMessage()`. Las páginas pueden usar `error.userMessage` directamente sin llamar a la función manualmente.

---

## Uso Correcto del API Layer

```jsx
// ✅ Correcto: usar la instancia compartida
import { api } from '../api/axios'

const { data } = await api.get('/api/v1/courses/subjects/')

// ❌ NUNCA: crear una instancia nueva de Axios
import axios from 'axios'
const { data } = await axios.get('http://api.example.com/...')
// Esto bypasea interceptores, auth, tenant header y refresh
```

> **Regla Non-Negotiable**: SIEMPRE usar `import { api } from '../api/axios'`. Nunca importar `axios` directamente para hacer requests al backend.
