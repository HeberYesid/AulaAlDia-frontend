# 🚀 Getting Started

## Requisitos Previos

| Herramienta | Versión Mínima | Verificar |
|-------------|---------------|-----------|
| **Node.js** | 18+ | `node --version` |
| **pnpm** | 10.24.0 | `pnpm --version` |
| **Backend AulaAlDía** | Corriendo en `:8000` | `curl http://127.0.0.1:8000/api/v1/` |

---

## Instalación

### 1. Clonar e instalar dependencias

```powershell
cd AulaAlDia-Frontend
pnpm install
```

### 2. Configurar variables de entorno

```powershell
cp .env.example .env
```

Editar `.env` con los valores apropiados:

```env
# URL base del backend Django
VITE_API_BASE_URL=http://127.0.0.1:8000

# Google OAuth Client ID (opcional — si no se define, el botón de Google no aparece)
VITE_GOOGLE_CLIENT_ID=

# Cloudflare Turnstile site key para captcha
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAB195XyO5y089iC-

# Email de contacto de soporte
VITE_SUPPORT_CONTACT_EMAIL=support@aulaaldia.com
```

> **Importante**: Todas las variables deben tener el prefijo `VITE_` para que Vite las exponga al cliente.

### 3. Levantar el dev server

```powershell
pnpm dev
```

El servidor arranca en **http://localhost:5173** con Hot Module Replacement (HMR).

---

## Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| **Dev** | `pnpm dev` | Servidor de desarrollo con HMR |
| **Build** | `pnpm build` | Build de producción → `dist/` |
| **Preview** | `pnpm preview` | Previsualizar build de producción |
| **Lint** | `pnpm lint` | Ejecutar ESLint |
| **Lint Fix** | `pnpm lint:fix` | Ejecutar ESLint con auto-fix |
| **Test (watch)** | `pnpm test` | Vitest en modo watch |
| **Test (run)** | `pnpm test:run` | Vitest una sola ejecución |
| **Test Integration** | `pnpm test:integration` | Solo tests de integración |
| **Test UI** | `pnpm test:ui` | Vitest con UI de browser |
| **Test Coverage** | `pnpm test:coverage` | Vitest con reporte de cobertura |
| **Test E2E** | `pnpm test:e2e` | Playwright E2E tests |

---

## Verificación Rápida

Después de instalar, confirmar que todo funciona:

```powershell
# 1. Lint limpio
pnpm lint

# 2. Tests pasan
pnpm test:run

# 3. Build exitoso
pnpm build
```

---

## Estructura del `.env` en Producción

```env
VITE_API_BASE_URL=https://api.aulaaldia.com
VITE_GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com
VITE_TURNSTILE_SITE_KEY=tu-turnstile-key
VITE_SUPPORT_CONTACT_EMAIL=soporte@aulaaldia.com
```

---

## Troubleshooting Común

| Problema | Solución |
|----------|----------|
| `CORS error` al hacer requests | Verificar que el backend tenga `CORS_ALLOWED_ORIGINS` con `http://localhost:5173` |
| `Network Error` en login | Verificar que el backend esté corriendo en la URL de `VITE_API_BASE_URL` |
| Google login no aparece | Verificar que `VITE_GOOGLE_CLIENT_ID` esté definido en `.env` |
| Cambios de CSS no se reflejan | Verificar que no haya caché; probar `Ctrl+Shift+R` |
| Tests fallan por import errors | Ejecutar `pnpm install` para asegurar dependencias actualizadas |
