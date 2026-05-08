# ADR 0002: Navegación Data-Driven Centralizada

**Estado:** Aceptado  
**Fecha:** Noviembre 2024

## 1. Contexto y Problema

En las primeras fases del desarrollo, los links del sidebar y del navbar estaban "hardcodeados" (escritos directamente en el JSX de los componentes). 
Esto causaba varios problemas:
- La lógica para mostrar/ocultar items basada en roles (RBAC) estaba dispersa en varios archivos.
- Agregar un nuevo item de navegación requería tocar `Sidebar.jsx`, `NavBar.jsx`, la lógica del tour de onboarding, y el componente de rutas.
- Inconsistencias visuales entre menús móviles y de escritorio.

## 2. Decisión

Decidimos abstraer toda la configuración de navegación hacia un único archivo centralizado de datos: `src/utils/navigation.js`.

El componente `Sidebar` y el navbar consumen esta estructura de datos y generan los links dinámicamente mediante bucles (`map()`), filtrando por el rol del usuario autenticado.

```javascript
// Ejemplo de la estructura
{
  key: 'subjects',
  to: '/subjects',
  label: 'Materias',
  icon: BookOpenText,
  section: 'academic',
  roles: ['TEACHER', 'ADMIN'],
}
```

## 3. Consecuencias

### Positivas
- **Punto único de verdad**: Agregar una nueva ruta ahora solo requiere agregar un objeto al array en `navigation.js` y definir el componente en `App.jsx`.
- **Integración con Onboarding**: La misma estructura de datos sirvió para vincular las anclas (tour IDs) necesarias para `react-joyride` sin ensuciar los componentes visuales.
- **Seguridad y UI consistentes**: La regla de "quién ve qué enlace" está en un solo lugar y es la misma independientemente del tamaño de la pantalla.

### Negativas
- **Complejidad inicial**: El archivo `navigation.js` es grande (~500 líneas) y requiere entender la estructura del objeto antes de modificarlo.
- **Labels dinámicos**: Como el menú se renderiza estáticamente, cambiar el texto de un ítem dinámicamente (ej: mostrar un conteo en el label) requiere pasar una función evaluadora en lugar de un simple string, lo que aumenta ligeramente la complejidad.
