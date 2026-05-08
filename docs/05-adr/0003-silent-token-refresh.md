# ADR 0003: Refresh Silencioso de Tokens vía Interceptores Axios

**Estado:** Aceptado  
**Fecha:** Octubre 2024

## 1. Contexto y Problema

AulaAlDía utiliza JWT (JSON Web Tokens) cortos para acceso y tokens largos para refresh. Cuando un access token expira, la API devuelve un código de error HTTP 401 (Unauthorized).

Teníamos que decidir cómo manejar esta expiración:
1. **Logout forzado**: Si da 401, echar al usuario. (Mala experiencia de usuario).
2. **Refresh predictivo**: Hacer un timeout en el frontend que refresque el token justo antes de que expire. (Propenso a fallos si las pestañas se suspenden o el reloj del cliente difiere del servidor).
3. **Refresh reactivo/silencioso**: Interceptar el 401, pausar la petición original, refrescar el token, y luego reintentar la petición original.

## 2. Decisión

Implementamos la opción 3: **Refresh reactivo/silencioso mediante interceptores de Axios** (`src/api/axios.js`).

1. Axios atrapa cualquier respuesta `401`.
2. Si tenemos un refresh token y no estamos ya refrescando (`isRefreshing === false`), hacemos un request a `/api/v1/auth/token/refresh/`.
3. Todas las llamadas subsecuentes que fallen con 401 mientras el refresh está en curso se "encolan" en un array en memoria (`pendingRequests`).
4. Cuando el refresh tiene éxito, guardamos el nuevo token y ejecutamos todas las llamadas encoladas con el nuevo header de autorización.

## 3. Consecuencias

### Positivas
- **Experiencia de usuario fluida**: El usuario nunca se da cuenta de que su token expiró. Sus clics y peticiones siguen funcionando con una latencia ligeramente mayor mientras ocurre el refresh en background.
- **Evita Race Conditions**: Gracias al flag `isRefreshing` y la cola de `pendingRequests`, si una página hace 5 llamadas API simultáneas al cargar y el token está expirado, solo se hace **un** request de refresh, no cinco.
- **Robustez cross-tab**: El AuthContext escucha eventos del storage. Si una pestaña falla el refresh y desloguea al usuario, las demás pestañas lo detectan y también se desloguean.

### Negativas
- **Lógica compleja**: El interceptor de respuesta en `axios.js` es uno de los bloques de código más complejos de la aplicación debido al manejo de asincronía y colas de promesas.
- **Edge cases con el primer request fallido**: Si el backend está temporalmente caído durante el refresh, el usuario es deslogueado abruptamente, perdiendo cualquier progreso en formularios locales.
