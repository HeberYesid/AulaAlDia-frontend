# 🏗️ Architecture Decision Records (ADRs)

Este directorio contiene los registros de decisiones arquitectónicas importantes tomadas durante el desarrollo del frontend de AulaAlDía.

Usamos los ADRs para documentar **el por qué** detrás de las decisiones técnicas clave, de modo que el contexto no se pierda con el tiempo o cuando el equipo cambie.

## Índice de ADRs

| Número | Título | Estado |
|--------|--------|--------|
| [0001](./0001-react-context-for-state.md) | Uso de React Context para Estado Global en lugar de Redux/Zustand | Aceptado |
| [0002](./0002-data-driven-navigation.md) | Navegación Data-Driven Centralizada | Aceptado |
| [0003](./0003-silent-token-refresh.md) | Refresh Silencioso de Tokens vía Interceptores Axios | Aceptado |
| [0004](./0004-css-vars-tenant-branding.md) | Branding Multi-Tenant vía CSS Custom Properties | Aceptado |

---

## Formato de un ADR

Si vas a agregar una nueva decisión arquitectónica, por favor sigue esta estructura:

1. **Título**: `[Número] - [Título Corto]` (Ej: `0005-migracion-a-tailwind.md`)
2. **Contexto**: ¿Cuál es el problema que estamos resolviendo?
3. **Decisión**: ¿Qué decidimos hacer?
4. **Consecuencias**: ¿Qué impactos positivos y negativos tiene esta decisión?
