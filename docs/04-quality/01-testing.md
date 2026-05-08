# 🧪 Estrategia de Testing

## Herramientas

| Herramienta | Propósito | Config |
|-------------|-----------|--------|
| **Vitest** | Test runner + assertions | `vitest.config.js` |
| **React Testing Library** | Render de componentes + queries | `@testing-library/react` |
| **@testing-library/user-event** | Simulación de interacciones de usuario | Clicks, typing, etc. |
| **@testing-library/jest-dom** | Matchers custom para DOM | `toBeInTheDocument()`, etc. |
| **jsdom** | DOM virtual para tests | Environment de Vitest |
| **Playwright** | E2E browser tests | `playwright.config.js` |

---

## Configuración de Vitest

```javascript
// vitest.config.js
{
  test: {
    globals: true,            // describe, it, expect sin import
    environment: 'jsdom',     // DOM virtual
    setupFiles: './src/test/setup.js',
    css: true,                // Procesar CSS imports
    restoreMocks: true,       // Auto-restore mocks entre tests
    clearMocks: true,         // Auto-clear mocks entre tests
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 50,
        functions: 50,
        statements: 50,
        branches: 40,
      },
    },
  },
  resolve: {
    alias: { '@': './src' },
  },
}
```

---

## Estructura de Tests

```
src/
├── test/
│   ├── setup.js              # Setup global (jest-dom matchers)
│   └── utils.jsx             # render() con providers preconfigurados
│
├── pages/__tests__/           # Tests de páginas (37 archivos)
│   ├── Login.test.jsx
│   ├── Dashboard.test.jsx
│   ├── SubjectDetail.test.jsx
│   └── ...
│
├── components/__tests__/      # Tests de componentes
├── hooks/__tests__/           # Tests de hooks
├── api/__tests__/             # Tests de la capa API
├── utils/__tests__/           # Tests de utilidades
├── state/__tests__/           # Tests de contextos
│
├── integration/               # Tests de integración
│   ├── auth-protected-route.integration.test.jsx
│   └── notification-bell.integration.test.jsx
│
└── (e2e/ en la raíz)
    └── 01_home.spec.js        # Test E2E con Playwright
```

---

## Cobertura de Tests por Página

El proyecto tiene **37 archivos de test** para páginas, cubriendo todos los módulos principales:

| Módulo | Tests |
|--------|-------|
| **Auth** | Login, Register, RegisterTeacher, RegisterTutor, CompleteRegistration, ForgotPassword, ResetPassword, VerifyCode |
| **Dashboard** | Dashboard, AdminDashboard, StudentDashboard |
| **Académico** | Subjects, SubjectDetail, ExerciseDetail, MyResults, MySubjects, Calendar, Schedules, TeacherEvaluations, MyTeacherAttendanceHistory |
| **Admin** | AdminNews, AdminUsers, AdminBulletins, AdminSupportTickets, AdminTeacherAttendance, AcademicSettings, TenantOperationsAudit, TenantCommercialAdmin |
| **Curricular** | Curriculums, GradeLevels, Sections, Courses |
| **Comunicación** | Messages, Notifications |
| **Otros** | UserProfile, MyBulletins, Home |

---

## Cómo Escribir Tests

### Test Setup — Render con Providers

```jsx
// src/test/utils.jsx
// Provee: BrowserRouter + AuthContext + ThemeContext + TourContext

import { render } from './test/utils'

// Render con providers preconfigurados
render(<MyComponent />, {
  authValue: { user: mockUser, isAuthenticated: true },
})
```

### Patrón estándar de un test de página

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import MyPage from '../MyPage'
import { api } from '../../api/axios'

// Mock la capa API
vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('MyPage', () => {
  const mockUser = {
    role: 'TEACHER',
    first_name: 'Carlos',
    email: 'carlos@test.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page title', async () => {
    api.get.mockResolvedValueOnce({ data: { results: [] } })

    render(<MyPage />, {
      authValue: { user: mockUser, isAuthenticated: true },
    })

    expect(screen.getByRole('heading', { name: /mi página/i })).toBeInTheDocument()
  })

  it('loads and displays data', async () => {
    api.get.mockResolvedValueOnce({
      data: { results: [{ id: 1, name: 'Item 1' }] },
    })

    render(<MyPage />, {
      authValue: { user: mockUser, isAuthenticated: true },
    })

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument()
    })
  })

  it('handles errors gracefully', async () => {
    api.get.mockRejectedValueOnce(new Error('Network Error'))

    render(<MyPage />, {
      authValue: { user: mockUser, isAuthenticated: true },
    })

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})
```

---

## Comandos

```powershell
# Todos los tests (una vez)
pnpm test:run

# Modo watch (re-ejecuta al guardar)
pnpm test

# Solo un archivo
pnpm test:run -- src/pages/__tests__/Login.test.jsx

# Solo un test específico
pnpm test:run -- src/pages/__tests__/Login.test.jsx -t "renders login form"

# Solo tests de integración
pnpm test:integration

# Con UI de browser
pnpm test:ui

# Con reporte de cobertura
pnpm test:coverage

# E2E con Playwright
pnpm test:e2e
```

---

## Umbrales de Cobertura

| Métrica | Mínimo |
|---------|--------|
| Lines | 50% |
| Functions | 50% |
| Statements | 50% |
| Branches | 40% |

El build de CI falla si no se cumplen estos umbrales.

---

## Tests de Integración

Los tests de integración validan flujos que cruzan múltiples componentes:

### `auth-protected-route.integration.test.jsx`
Verifica que `ProtectedRoute` interactúa correctamente con `AuthContext`:
- Redirect a `/login` cuando no hay usuario
- Mostrar contenido cuando el usuario tiene el rol correcto
- Gate de año escolar cuando no está activo

### `notification-bell.integration.test.jsx`
Verifica el flujo completo de `NotificationBell`:
- Polling de conteo no leído
- Render del dropdown con notificaciones
- Marcar como leída

---

## Tests E2E (Playwright)

### Configuración

```javascript
// playwright.config.js
{
  testDir: './e2e',
  webServer: {
    command: 'pnpm dev',
    port: 5173,
  },
}
```

### Tests existentes
- `01_home.spec.js` — Verifica que la home pública carga correctamente

### Ejecutar
```powershell
pnpm test:e2e
```

---

## Buenas Prácticas

1. **Mock la capa API, no los hooks**: Mockear `api.get`/`api.post` da tests más realistas que mockear el hook completo
2. **Usar `screen` queries**: `getByRole`, `getByText`, `getByLabelText` en ese orden de preferencia
3. **`waitFor` para async**: Cualquier efecto que depende de un fetch necesita `waitFor`
4. **Un describe por archivo**: El describe principal debe coincidir con el nombre del componente
5. **Test names descriptivos**: `it('shows error message when API returns 400')` > `it('handles error')`
