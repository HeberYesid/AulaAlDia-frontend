# Contributing to AulaAlDia Frontend

## GitHub Flow Adaptado

Este repositorio usa un GitHub Flow adaptado con una rama protegida:

- `main`: rama de produccion, solo se actualiza desde PRs validados.

Todo cambio debe salir desde una rama corta creada a partir de `main` y entrar por Pull Request.

## Nombre de ramas

Usa este patron:

`<tipo>/<descripcion-corta>`

Tipos permitidos:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`
- `perf`
- `ci`
- `build`
- `hotfix`

Ejemplos:

- `feat/dashboard-teacher-metrics`
- `fix/login-redirect-loop`
- `docs/setup-variables`

## Flujo diario

1. Sincroniza `main`.
2. Crea una rama nueva con el patron permitido.
3. Implementa cambios pequenos y commitea con Conventional Commits.
4. Ejecuta quality gate local.
5. Abre PR hacia `main`.
6. Vincula issue en la descripcion (`Closes #123`).
7. Espera checks en verde y mergea con `squash`.

## Convencion de commits y titulo del PR

Formato esperado:

`type(scope): descripcion`

Ejemplos validos:

- `feat(auth): add tenant switcher in topbar`
- `fix(messaging): prevent empty message submit`

El titulo del PR debe seguir el mismo formato.

## Quality Gate Local

```bash
pnpm install
pnpm lint
pnpm build
pnpm test:integration
pnpm test:coverage
```

## Requisitos del Pull Request

- Debe incluir issue vinculada con `Closes #N`, `Fixes #N` o `Resolves #N`.
- Debe salir de una rama con patron valido.
- Debe tener titulo estilo Conventional Commits.
- Debe indicar que pruebas fueron ejecutadas.

## Recomendacion de branch protection

Configura en GitHub para `main`:

- Require a pull request before merging.
- Require status checks to pass before merging.
- Require conversation resolution before merging.
- Do not allow force pushes.
- Do not allow deletions.
