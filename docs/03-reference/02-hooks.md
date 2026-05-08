# 🪝 Custom Hooks

Hooks personalizados ubicados en `src/hooks/`. Extraen lógica reutilizable de las páginas para mantener los componentes enfocados en presentación.

---

## `useAcademicSettings`
**Archivo**: `useAcademicSettings.js` (18KB — el hook más complejo)

Gestiona toda la lógica de configuración académica: años escolares, periodos académicos, escalas de calificación y jornadas.

### Responsabilidades
- CRUD de años escolares (crear, activar, cerrar)
- CRUD de periodos académicos (crear, editar, eliminar)
- Configuración de escalas de calificación
- Gestión de jornadas escolares
- Validación de datos antes de enviar al backend

### Uso típico
```jsx
import { useAcademicSettings } from '../hooks/useAcademicSettings'

function AcademicSettings() {
  const {
    schoolYears,
    periods,
    gradingScales,
    loading,
    createSchoolYear,
    activateSchoolYear,
    createPeriod,
    // ...
  } = useAcademicSettings()
}
```

---

## `useAdminDashboardData`
**Archivo**: `useAdminDashboardData.js` (14KB)

Centraliza la obtención de datos para el dashboard administrativo.

### Datos que gestiona
- Conteos: estudiantes, docentes, materias, cursos activos
- Estadísticas de asistencia docente
- Novedades recientes
- Tickets de soporte pendientes
- Estado del año escolar

### Patrón
Hace múltiples requests en paralelo al montar y expone un objeto unificado con loading states individuales.

---

## `useObservations`
**Archivo**: `useObservations.js` (3.4KB)

CRUD de observaciones del observador académico.

### API
```javascript
const {
  observations,      // Lista de observaciones
  loading,           // Estado de carga
  fetchObservations, // Recargar lista
  createObservation, // Crear nueva
  updateObservation, // Editar existente
  deleteObservation, // Eliminar
} = useObservations(studentId)
```

---

## `useSchedules`
**Archivo**: `useSchedules.js` (5KB)

Lógica de horarios académicos con formateo para la vista de calendario semanal.

### Responsabilidades
- Fetch de horarios por rol (admin ve todos, teacher ve los propios, student ve los de sus materias)
- Transformación de datos para el componente de calendario
- Filtros por día de la semana

---

## `useStudentSearch`
**Archivo**: `useStudentSearch.js` (1.8KB)

Búsqueda de estudiantes con debounce.

### API
```javascript
const {
  query,          // Texto de búsqueda actual
  setQuery,       // Setter
  results,        // Estudiantes encontrados
  loading,        // Estado de carga
} = useStudentSearch({ minLength: 3, debounceMs: 300 })
```

---

## `useSupportTickets`
**Archivo**: `useSupportTickets.js` (2.2KB)

CRUD de tickets de soporte técnico.

### API
```javascript
const {
  tickets,        // Lista de tickets
  loading,
  createTicket,   // Crear nuevo ticket
  fetchTickets,   // Recargar lista
} = useSupportTickets()
```

---

## `useTeacherAttendance`
**Archivo**: `useTeacherAttendance.js` (868B)

Hook simple para registrar entrada/salida de asistencia docente.

---

## `useTenantUsers`
**Archivo**: `useTenantUsers.js` (4.1KB)

Gestión de usuarios del tenant activo: listado, búsqueda, cambio de rol, activación/desactivación.

### API
```javascript
const {
  users,           // Lista de usuarios
  loading,
  fetchUsers,      // Recargar con filtros
  updateUserRole,  // Cambiar rol
  toggleUserActive,// Activar/desactivar
} = useTenantUsers()
```

---

## Convenciones de Hooks

### Cuándo crear un hook

| Situación | Acción |
|-----------|--------|
| Lógica de fetch + estado usada en una sola página grande | ✅ Extraer a hook |
| Lógica compartida entre 2+ páginas | ✅ Extraer a hook |
| Estado local simple de un formulario | ❌ Mantener en el componente |
| Transformación pura de datos | ❌ Usar `utils/` en su lugar |

### Patrón estándar

```javascript
// src/hooks/useExample.js
import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/axios'

export function useExample(params) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: response } = await api.get('/api/v1/...', { params })
      setData(response)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
```

### Naming

- Siempre empezar con `use`
- Nombre descriptivo del dominio: `useAcademicSettings`, no `useSettings`
- Un hook por archivo
- Archivo en `camelCase.js`
