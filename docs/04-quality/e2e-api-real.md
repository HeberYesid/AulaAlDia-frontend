# Prueba de navegador contra la API real (P2b)

El escenario usa el build de producción y dos contextos de Chromium. Comprueba el login real, el listado de asignaciones de cada institución y las respuestas `404` y `200` para el mismo detalle con sesiones distintas. No usa mocks ni inyecta tokens.

1. Preparar el backend PostgreSQL de P2a con sus datos sintéticos (ver `docs/ci-postgresql.md` en el backend). Registrar los SHA de ambos repositorios. No apuntar a producción.
2. En la sesión del frontend, definir `VITE_API_BASE_URL=http://127.0.0.1:8010`, `AULA_E2E_MANIFEST` y `AULA_E2E_PASSWORD` con los valores de esa ejecución. Elegir un `AULA_E2E_PREVIEW_PORT` libre si 4173 está ocupado.
3. Ejecutar:

   ```powershell
   pnpm install --frozen-lockfile
   pnpm exec playwright install chromium
   pnpm build
   pnpm exec playwright test e2e/01_home.spec.js
   ```

Playwright arranca y cierra Vite Preview. Al terminar, detener los recursos desechables del backend. No subir credenciales, trazas ni manifiestos como artefactos. La ejecución cruzada en GitHub no está habilitada: requiere una vía autorizada para consumir el SHA del backend privado sin exponer credenciales a PRs.

**Hallazgo independiente:** durante el primer ensayo, el login y el listado de A respondieron `200`, pero una recarga posterior perdió la sesión tras respuestas `401` de renovación y no llegó a solicitar el detalle. El escenario de aislamiento entra a ese enlace protegido por el formulario y abre el detalle propio desde el listado; no verifica que la sesión sobreviva a recargas rápidas. No se cambió la lógica de sesión.
