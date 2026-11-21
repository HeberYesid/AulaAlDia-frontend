# Plan 001: convertir AulaAlDía en una demo SaaS multi-tenant verificable

> **Ejecución:** Roadmap para **dos repositorios hermanos**, `AulaAlDia-Frontend/` y `AulaAlDia-Backend/`. Este archivo vive en el frontend; antes de editar cada repositorio, leer su `AGENTS.md`, validar su rama y sus cambios locales. Una demo pública, despliegue y cambios de repositorio remoto requieren decisión explícita del propietario. Ante drift, detenerse y revalidar el plan.

## Ficha y resultado buscado

- **Prioridad:** P1; **esfuerzo:** 5–8 semanas parciales; **riesgo:** medio-alto por datos académicos y límites entre instituciones.
- **Base de planificación (2026-09-28):** frontend `6c11dcc`; backend `11a85f1`. Verificar por separado `git diff --stat <SHA>..HEAD` y `git status --short` en cada repositorio antes de ejecutar.
- **Historia para CV:** un operador puede mostrar, sin datos reales de alumnos, el flujo administrador → docente → estudiante en una institución de demostración; las pruebas demuestran que otra institución no puede consultar ni modificar esos datos.
- **Vocabulario del producto:** `Tenant` (institución), `Membership` (membresía), `Enrollment` (inscripción), `Bulletin` (boletín congelado); usarlo de forma consistente con `../docs/PRD.md:126-130`.

## Estado verificado y ajuste de prioridades

| Evidencia | Decisión |
|---|---|
| La carpeta `AulaAlDia/` no es git, pero **ambos subproyectos sí tienen `.git` y commits**. | No ejecutar `git init` ni reconstruir historial. Versionar cambios de frontend y backend en sus respectivos repos; evaluar el padre documental aparte si hace falta. |
| `AulaAlDia-Frontend/package.json:1-18` es React 18/Vite/JSX con Vitest, integración, coverage y E2E; `AulaAlDia-Backend/pyproject.toml:1-7,20-29` usa Python 3.13 y Django 5.2.16. | Tratar las versiones en READMEs/AGENTS como susceptibles de drift; no vender una migración total a TypeScript como condición previa para la demo. |
| Ambos repos tienen `.github/workflows/ci.yml`; frontend corre lint/build/integración/cobertura y backend ejecuta Ruff, check de deploy, migraciones y pytest. | CI existe. Priorizar pruebas de aislamiento y demo, no duplicar workflows sin necesidad. |
| `src/App.jsx:32-42,79-142` define rutas públicas, rutas protegidas y dashboards; `src/state/TourContext.jsx:25-35,47-55` requiere usuario autenticado para el tour existente. | El tour de onboarding **no es** una demo pública sin login; diseñar flujo demo explícito. |
| `src/api/axios.js:8-14,89-123` centraliza sesión/token y `X-Tenant-ID`. | Toda vista demo integrada conserva ese cliente y el `AuthContext`; no inventar un segundo mecanismo de sesión ni confiar en esconder botones como control de acceso. |
| `../docs/PRD.md:110-122` sitúa la fase académica 2 como actual; `../docs/MONOREPO_SPLIT_RUNBOOK.md:1-8` aún habla de DevTrack y de un split pendiente. | Verificar flujos académicos reales y actualizar documentación obsoleta, sin repetir un split ya realizado. |

**Conservación de diseño:** reutilizar tokens, paleta y focus de `DESIGN.md:21-56`, componentes y CSS existentes; no introducir Tailwind solo porque el PRD lo mencione (`../docs/PRD.md:100-105`). Backend: resolución de tenant en `accounts/tenant_context.py` y filtrado compartido en `courses/views/helpers.py` según `AulaAlDia-Backend/AGENTS.md`.

## Hitos con entregables y aceptación

### H1 — Baseline y matriz tenant × rol (semana 1)

1. En backend ejecutar `uv run ruff check .`, `uv run python manage.py check`, `uv run pytest`; en frontend `pnpm lint`, `pnpm build`, `pnpm test:run`, `pnpm test:integration`. Registrar fallos observados, no inferir salud por los workflows.
2. Trazar un recorrido corto con endpoints reales: crear institución de prueba y membresías, configurar curso/período, registrar asistencia/calificaciones y leer boletín. Relacionar cada operación con ADMIN/TEACHER/STUDENT y `Tenant A` / `Tenant B`.
3. Revisar antes de inventar tests nuevos los que ya cubren permisos, `accounts/tenant_context.py`, `courses/views/helpers.py` y peticiones desde `src/api/axios.js`; definir casos faltantes de lectura y escritura cruzada y roles incorrectos. Usar fixtures aisladas, sin identidades reales.

**Salida:** matriz de permisos con ruta/test por acción, flujos efectivamente funcionales identificados y baseline reproducible. **STOP** si los tests existentes fallan por configuración o no hay manera de levantar entorno de prueba sin credenciales reales.

### H2 — Demo pública sin datos sensibles (semanas 2–3)

1. Elegir una de dos formas con base en costo y operaciones: **recorrido público de solo lectura con fixtures estáticas** (preferida para portafolio) en el frontend, o **tenant demo desechable con cuentas de prueba y reset automático** si hace falta demostrar escrituras reales. No convertir `/api/` de producción en acceso anónimo a datos académicos.
2. Implementar un recorrido acotado en `src/App.jsx` y páginas/componentes apropiados que explique rol, institución y acciones; reutilizar `src/components/AppTour` solo si es compatible sin acoplarlo a una sesión ficticia. Si se usan fixtures, indicar claramente qué pantallas son simuladas y ofrecer acceso separado al flujo real.
3. Para la modalidad tenant desechable, separar BD/entorno o tenant demo, generar únicamente datos sintéticos, limitar permisos y definir reset/expiración; añadir tests de aislamiento en backend y flujo browser en frontend. Si esas garantías no están verificadas, quedarse con demo estática.
4. Verificar lectura móvil/escritorio, teclado/foco, estados vacíos y no exposición de URLs firmadas, nombres o correos reales. Medir qué tres pantallas comunican mejor multi-tenancy, roles y trazabilidad.

**Salida:** enlace demo con recorrido reproducible sin cuenta personal ni datos de alumnos; fixture documentada y checks de no escritura pública. **Verificación:** comandos de H1 y `pnpm test:e2e` para navegación pública; si se eligió tenant de prueba, además pruebas de backend A/B y política de reset.

### H3 — Caso de estudio y despliegue seguro (semanas 4–5)

1. Actualizar README de frontend y backend con diagrama sencillo React → DRF → PostgreSQL/Redis/almacenamiento, roles, captura de demo por rol, flujo académico verificable, comandos actuales y enlaces **solo después** de publicar. Referenciar `../docs/PRD.md` y señalar qué capacidades están implementadas frente a futuras.
2. Corregir o etiquetar como histórico el runbook de split `../docs/MONOREPO_SPLIT_RUNBOOK.md` y alinear `../docs/DEPLOYMENT_RUNBOOK.md` con los dos repos y los entornos reales; no cambiar documentación del padre sin acordar cómo se versionará.
3. Desplegar primero staging con datos ficticios. Validar configuración de orígenes, cookies/tokens, `X-Tenant-ID`, enlaces de correo, migraciones y rollback por separado, siguiendo `../docs/DEPLOYMENT_RUNBOOK.md:5-51`. Registrar smoke de login, cambio de tenant, notas, boletines y permisos cruzados; luego publicar solo con autorización.

**Salida:** README ejecutable, capturas anonimizadas, pipeline de ambos repos verde y smoke documentado en staging; acceso público probado en navegador antes de anunciarlo como CV. **STOP** si una ruta no aísla datos por tenant o aparecen datos personales en fixtures/capturas.

### H4 — TypeScript incremental si aporta al mantenimiento (semanas 6–8, opcional)

1. Abrir decisión técnica con alcance limitado a contratos API y módulos nuevos; fijar estrategia `allowJs`/`checkJs` o archivos `.ts/.tsx` por frontera, sin conversión masiva de `src/App.jsx` ni reemplazo de Axios/AuthContext.
2. Tipar primero DTOs para tenant/rol y respuestas críticas, con verificación TypeScript **agregada como script y gate CI** cuando la configuración exista. Migrar un flujo acotado y medir errores/tiempo de mantenimiento antes de extenderlo.

**Salida:** primera frontera tipada con tests existentes verdes y `pnpm typecheck` agregado y verde; si no mejora los contratos críticos, posponer migración. **No** prometer frontend entero en TS en la primera release.

## Comandos, límites y mantenimiento

| Repositorio | Verificación desde su raíz | Expectativa |
|---|---|---|
| `AulaAlDia-Frontend/` | `pnpm lint` · `pnpm build` · `pnpm test:run` · `pnpm test:integration` · `pnpm test:coverage` | Todos terminan 0; tests de demo/roles incluidos. |
| `AulaAlDia-Frontend/` | `pnpm test:e2e` | Flujos relevantes pasan con app/backend o fixtures documentadas. |
| `AulaAlDia-Backend/` | `uv run ruff check .` · `uv run python manage.py check` · `uv run pytest` | Todos terminan 0; tests de tenant/rol incluidos. |
| `AulaAlDia-Backend/` | `uv run pytest --cov=. --cov-report=term-missing --cov-fail-under=75` | Cobertura y tests pasan si el entorno requerido está preparado. |

**Fuera del primer release:** app móvil nativa, SSO, migración de toda la UI a TypeScript, restablecer artificialmente `.git` en el padre y exponer endpoints académicos sin autenticar. Para una demo que usa datos ficticios, documentar qué es simulación y qué es funcionalidad integrada. Revisar el diff de **ambos repos** por separado antes de dar por completado un hito.
