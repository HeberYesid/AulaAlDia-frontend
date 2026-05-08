# 📚 AulaAlDía Frontend — Documentación

Bienvenido al hub de documentación del frontend de **AulaAlDía**, una plataforma educativa multi-tenant construida con React 18 + Vite.

Esta guía está organizada para que un nuevo desarrollador pueda entender, configurar y contribuir al proyecto en el menor tiempo posible.

---

## 📖 Índice

| # | Documento | Descripción |
|---|-----------|-------------|
| 01 | [Visión General](./01-architecture/01-overview.md) | Qué es AulaAlDía, stack tecnológico y decisiones clave |
| 02 | [Estructura del Proyecto](./01-architecture/02-project-structure.md) | Mapa de carpetas y convenciones de archivos |
| 03 | [Diagramas de Arquitectura](./01-architecture/03-diagrams.md) | Diagramas Mermaid: componentes, flujos y datos |
| 04 | [Getting Started](./02-guides/01-getting-started.md) | Instalación, configuración y primer `pnpm dev` |
| 05 | [Routing y Navegación](./02-guides/02-routing.md) | Tabla de rutas, guards y layout de navegación |
| 06 | [Estado y Contextos](./02-guides/03-state-management.md) | AuthContext, ThemeContext, TourContext |
| 07 | [Capa API y Axios](./02-guides/04-api-layer.md) | Cliente HTTP, interceptores, refresh de tokens |
| 08 | [Componentes](./03-reference/01-components.md) | Catálogo de componentes reutilizables |
| 09 | [Hooks Personalizados](./03-reference/02-hooks.md) | Custom hooks y su uso |
| 10 | [Utilidades](./03-reference/03-utilities.md) | Toast, errores, navegación, constantes |
| 11 | [Testing](./04-quality/01-testing.md) | Vitest, RTL, Playwright, cobertura |
| 12 | [Deployment](./04-quality/02-deployment.md) | Build, Vercel, Nginx, variables de entorno |
| 13 | [Architecture Decision Records](./05-adr/README.md) | Registro de decisiones arquitectónicas (ADRs) |

---

## 🗺️ Mapa visual rápido

```
docs/
├── README.md                        ← Estás aquí
├── 01-architecture/
│   ├── 01-overview.md               ← Stack y decisiones
│   ├── 02-project-structure.md      ← Mapa de carpetas
│   └── 03-diagrams.md               ← Diagramas Mermaid
├── 02-guides/
│   ├── 01-getting-started.md        ← Setup inicial
│   ├── 02-routing.md                ← Rutas y guards
│   ├── 03-state-management.md       ← Contextos React
│   └── 04-api-layer.md              ← Axios + interceptores
├── 03-reference/
│   ├── 01-components.md             ← Catálogo UI
│   ├── 02-hooks.md                  ← Custom hooks
│   └── 03-utilities.md              ← Helpers y constantes
└── 04-quality/
    ├── 01-testing.md                ← Estrategia de tests
    └── 02-deployment.md             ← Deploy y CI
├── 05-adr/
    ├── README.md                    ← Índice de ADRs
    ├── 0001-react-context-...       ← ADR 1
    └── ...                          ← Otros ADRs
```

---

## ⚡ Quick Start

```powershell
cd AulaAlDia-Frontend
pnpm install
cp .env.example .env
pnpm dev
```

El servidor arranca en `http://localhost:5173`.

> **Requisito**: El backend Django debe estar corriendo en `http://127.0.0.1:8000` (o la URL configurada en `VITE_API_BASE_URL`).
