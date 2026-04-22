# AulaAlDia — Frontend

Aplicación web SPA construida con **React 18 + Vite** para la plataforma educativa **AulaAlDia**. Permite gestionar horarios, materias, notas, boletines, mensajería interna, notificaciones y mucho más, adaptándose a tres roles principales: **Estudiante**, **Docente** y **Administrador**.

---

## Tabla de contenidos

1. [Tecnologías](#tecnologías)
2. [Requisitos previos](#requisitos-previos)
3. [Configuración del entorno](#configuración-del-entorno)
4. [Inicio rápido](#inicio-rápido)
5. [Scripts disponibles](#scripts-disponibles)
6. [Variables de entorno](#variables-de-entorno)
7. [Estructura del proyecto](#estructura-del-proyecto)
8. [Roles y funcionalidades](#roles-y-funcionalidades)
9. [Testing](#testing)
10. [Despliegue](#despliegue)
11. [Guía de diseño](#guía-de-diseño)
12. [Contribución y GitHub Flow](#contribución-y-github-flow)

---

## Tecnologías

| Herramienta | Versión | Propósito |
|---|---|---|
| React | 18.3 | UI declarativa basada en componentes |
| Vite | 7 | Bundler y servidor de desarrollo |
| React Router DOM | 6 | Enrutamiento SPA |
| Axios | 1 | Cliente HTTP hacia la API REST |
| React Big Calendar | 1 | Calendario académico interactivo |
| Lucide React | 0.575 | Iconografía SVG |
| React Joyride | 2 | Tour guiado de bienvenida |
| date-fns | 4 | Utilidades de fecha |
| jwt-decode | 4 | Decodificación de JWT en cliente |
| @react-oauth/google | 0.12 | Autenticación OAuth con Google |
| Vitest | 4 | Framework de pruebas unitarias e integración |

---

## Requisitos previos

- **Node.js** ≥ 18
- **pnpm** ≥ 10 (`npm install -g pnpm`)
- Una instancia del **backend AulaAlDia** corriendo (por defecto en `http://127.0.0.1:8000`)

---

## Configuración del entorno

```bash
# 1. Instalar dependencias
pnpm install

# 2. Crear el archivo de variables de entorno
cp .env.example .env   # Linux / macOS
copy .env.example .env # Windows (PowerShell)

# 3. Editar .env con los valores reales (ver sección de variables)
```

---

## Inicio rápido

```bash
pnpm dev
```

La aplicación queda disponible en **http://localhost:5173**.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Servidor de desarrollo con HMR |
| `pnpm build` | Build de producción en `dist/` |
| `pnpm preview` | Previsualizar el build de producción |
| `pnpm lint` | Análisis estático con ESLint |
| `pnpm lint:fix` | Corrección automática de errores de lint |
| `pnpm test` | Pruebas en modo watch (Vitest) |
| `pnpm test:run` | Pruebas una sola vez |
| `pnpm test:integration` | Únicamente las pruebas de integración (`src/integration`) |
| `pnpm test:coverage` | Cobertura de código con `@vitest/coverage-v8` |
| `pnpm test:ui` | Interfaz visual de Vitest |

### Quality gate completo

```bash
pnpm lint && pnpm build && pnpm test:integration && pnpm test:coverage
```

---

## Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores:

| Variable | Ejemplo | Descripción |
|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000` | URL base de la API REST del backend |
| `VITE_GOOGLE_CLIENT_ID` | `123456.apps.googleusercontent.com` | Client ID de Google OAuth 2.0 |
| `VITE_TURNSTILE_SITE_KEY` | `0x4AAAAAAB195...` | Site key de Cloudflare Turnstile (CAPTCHA) |
| `VITE_SUPPORT_CONTACT_EMAIL` | `support@aulaaldia.com` | Correo mostrado en la página de contacto |

> Las variables que empiezan con `VITE_` son expuestas al cliente. No incluyas secretos en el frontend.

---

## Estructura del proyecto

```
src/
├── api/                  # Clientes HTTP (Axios) y definición de endpoints
├── components/           # Componentes reutilizables (Sidebar, NavBar, etc.)
├── constants/            # Constantes globales de la aplicación
├── hooks/                # Custom React Hooks
├── integration/          # Pruebas de integración
├── pages/                # Vistas por ruta (una carpeta / archivo por página)
│   ├── curriculums/      # Gestión de currículos, grados, secciones y cursos
│   └── messaging/        # Sistema de mensajería interna
├── state/                # Contextos globales (AuthContext, ThemeContext)
├── styles/               # Estilos compartidos y variables CSS
├── test/                 # Utilidades de prueba (setup, mocks)
├── utils/                # Funciones de utilidad genéricas
├── App.jsx               # Árbol de rutas principal
└── main.jsx              # Punto de entrada de la aplicación
```

---

## Roles y funcionalidades

### 👩‍🎓 Estudiante / Tutor
- Dashboard personal con estadísticas y materias
- Mis Materias y detalle de ejercicios
- Mis Boletines y Mis Resultados
- Calendario académico y Horarios
- Registro de ausencias
- Mensajería interna
- Notificaciones
- Observador del estudiante
- Evaluaciones docentes

### 👨‍🏫 Docente
- Dashboard con listado de clases y estadísticas
- Gestión de materias y ejercicios
- Registro de asistencia y historial
- Calendario y horarios
- Mensajería y notificaciones

### 🛠️ Administrador
- Panel de administración con métricas globales
- Gestión de usuarios (crear, editar, importar CSV)
- Configuración académica (años escolares, grados, secciones, cursos, currículos)
- Boletines, noticias y tickets de soporte
- Asistencia docente
- Auditoría de operaciones
- Panel comercial multi-tenant

---

## Testing

Las pruebas usan **Vitest** + **@testing-library/react**.

```bash
# Correr todas las pruebas
pnpm test:run

# Solo integración
pnpm test:integration

# Reporte de cobertura
pnpm test:coverage
```

Los archivos de prueba viven junto al código en carpetas `__tests__/` dentro de cada módulo.

---

## Despliegue

El proyecto incluye configuración lista para **Vercel** (`vercel.json`) y **nginx** (`nginx.conf`).

### Vercel
El archivo `vercel.json` redirige todas las rutas al `index.html` para el enrutamiento SPA. Basta con conectar el repositorio en Vercel y configurar las variables de entorno de producción.

### Docker / nginx
`nginx.conf` sirve los archivos estáticos del build y redirige las rutas al `index.html`. Flujo típico:

```bash
pnpm build
# Copiar dist/ al servidor nginx o construir la imagen Docker
```

> Las variables de entorno de producción deben configurarse **antes** del build, ya que Vite las incrusta en el bundle en tiempo de compilación.

---

## Guía de diseño

El sistema de diseño está inspirado en Notion: paleta de neutros cálidos, tipografía con compresión a escala, bordes sutiles y sombras multicapa de baja opacidad. Consulta [`DESIGN.md`](./DESIGN.md) para ver la especificación completa de colores, tipografía, componentes y comportamiento responsive.

El tour de bienvenida integrado con **React Joyride** puede resetearse desde el perfil del usuario o directamente desde la consola del navegador. Consulta [`RESET_TOUR.md`](./RESET_TOUR.md) para más detalles.

---

## Contribución y GitHub Flow

Este repositorio usa GitHub Flow adaptado con rama base `develop`.

- Flujo, convenciones y checklist: `CONTRIBUTING.md`
- Plantilla de PR: `.github/PULL_REQUEST_TEMPLATE.md`
- Plantillas de issues: `.github/ISSUE_TEMPLATE/`
