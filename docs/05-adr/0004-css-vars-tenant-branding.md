# ADR 0004: Branding Multi-Tenant vía CSS Custom Properties

**Estado:** Aceptado  
**Fecha:** Diciembre 2024

## 1. Contexto y Problema

AulaAlDía es una plataforma *Multi-Tenant* (SaaS B2B). Diferentes colegios (tenants) inician sesión en la misma plataforma pero deben ver su propio logo y sus propios colores institucionales para sentir que están en "su" portal.

El backend devuelve para cada tenant un objeto con colores hexadecimales:
```json
{
  "primaryColor": "#1d4ed8",
  "accentColor": "#f59e0b",
  "logoUrl": "https://..."
}
```

Necesitábamos una forma de aplicar estos colores en toda la UI de React de forma eficiente.

## 2. Decisión

Decidimos utilizar **CSS Custom Properties (Variables CSS)** inyectadas dinámicamente en el `:root` del documento cada vez que cambia el tenant activo.

La función responsable vive en `AuthContext` (`applyBrandingToDocument(tenant)`):

```javascript
document.documentElement.style.setProperty('--primary', tenant.primaryColor);
document.documentElement.style.setProperty('--accent', tenant.accentColor);
// También se calculan variaciones (light/dark) mediante librerías de color (o cálculos nativos)
document.documentElement.style.setProperty('--primary-light', ...);
```

Todos los componentes de la aplicación usan estas variables en su CSS:
```css
.button-primary {
  background-color: var(--primary);
  border: 1px solid var(--primary-dark);
}
```

## 3. Consecuencias

### Positivas
- **Performance superior**: No necesitamos pasar los colores como "props" a cada componente de React ni usar CSS-in-JS (como Styled Components). Actualizar una variable CSS en el `:root` es instantáneo y nativo del navegador.
- **Integración con Dark Mode**: Funciona perfectamente con la estrategia de Dark Mode. Podemos definir el `primaryColor` y el CSS nativo aplica la opacidad o filtros según el tema activo.
- **Soporte Favicon**: La misma lógica actualiza el tag `<link rel="icon">` y el `<title>` del documento sin que React tenga que manejar el `<head>` mediante Portals o librerías extra (como react-helmet).

### Negativas
- **Lógica de contraste**: Al aceptar colores dinámicos elegidos por el cliente en el backend, corríamos el riesgo de problemas de accesibilidad (ej: texto blanco sobre un color primario muy claro). Debimos implementar lógica de validación de contraste de color en el backend para evitar combinaciones ilegibles.
