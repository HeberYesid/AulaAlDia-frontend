# ADR 0001: Uso de React Context para Estado Global

**Estado:** Aceptado  
**Fecha:** Noviembre 2024

## 1. Contexto y Problema

Necesitábamos una forma de manejar el estado global de la aplicación, específicamente:
- La sesión del usuario (tokens, datos de perfil, permisos).
- El tema visual (light/dark mode).
- El estado del tour de onboarding.

Las opciones principales eran:
1. Usar una librería externa como Redux, Zustand, o Recoil.
2. Usar la API nativa de React: `Context` + `hooks`.

## 2. Decisión

Decidimos utilizar **React Context + Hooks** (específicamente `useState` y `useReducer` interno si es necesario) para el estado global del frontend, sin depender de librerías externas.

Se crearon tres contextos separados y especializados:
- `AuthContext`
- `ThemeContext`
- `TourContext`

## 3. Consecuencias

### Positivas
- **Menos dependencias**: No agregamos peso al bundle con librerías externas pesadas (como Redux).
- **Curva de aprendizaje baja**: Cualquier desarrollador React conoce cómo funciona Context.
- **Separación de responsabilidades**: Al tener tres contextos distintos, evitamos re-renders innecesarios en toda la app (por ejemplo, cambiar el tema no dispara un render en componentes que solo consumen AuthContext).
- **Simplicidad**: El estado global de nuestra app es relativamente pequeño y no tiene mutaciones complejas o de alta frecuencia, por lo que Context es suficiente.

### Negativas
- **Optimización de renders**: Debemos tener cuidado de no poner demasiadas cosas en un solo contexto, ya que cualquier cambio en el valor del provider causará un re-render en todos sus consumidores (de ahí la decisión de separar en tres contextos).
- **No hay devtools integrados**: A diferencia de Redux o Zustand, depurar el historial de cambios de estado es un poco más manual.
