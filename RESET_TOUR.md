# Cómo Probar/Resetear el Tour de la Aplicación

## Problema Identificado y Solucionado

✅ **SOLUCIONADO**: Agregada clase `notification-bell` al componente `NotificationBell.jsx`

## Verificación del Tour

El tour debería aparecer automáticamente cuando:
1. Usuario está autenticado
2. Usuario está en la ruta `/` (Dashboard)
3. No ha completado el tour previamente
4. Han pasado 2 segundos desde que se cargó la página (delay para asegurar que el DOM esté listo)

## Cómo Resetear el Tour para Probarlo

### Opción 1: Desde la Consola del Navegador (Más Rápido)

1. Abre DevTools (F12)
2. Ve a la pestaña **Console**
3. Ejecuta uno de estos comandos según tu rol:

```javascript
// Para estudiante
localStorage.removeItem('aulaaldia-tour-completed-STUDENT')

// Para profesor
localStorage.removeItem('aulaaldia-tour-completed-TEACHER')

// O eliminar todos los tours
localStorage.clear()
```

4. Recarga la página (F5)

### Opción 2: Desde tu Perfil

1. Ve a tu **Perfil** (`/profile`)
2. Busca el botón **"🔄 Reiniciar Tour de Bienvenida"**
3. Haz clic y serás redirigido al dashboard con el tour activo

### Opción 3: Desde DevTools Storage

1. Abre DevTools (F12)
2. Ve a **Application** > **Local Storage** > `http://localhost:5173`
3. Busca las claves que empiecen con `aulaaldia-tour-completed-`
4. Elimina la que corresponda a tu rol
5. Recarga la página

## Verificar que el Tour Está Funcionando

### 1. Verifica la Consola

Deberías ver estos logs en la consola del navegador:

```
[AppTour] Debug: {
  isAuthenticated: true,
  userRole: "STUDENT" (o "TEACHER" o "ADMIN"),
  pathname: "/",
  hasCompletedTour: null,
  tourKey: "aulaaldia-tour-completed-STUDENT"
}

[AppTour] Iniciando tour para rol: STUDENT
[AppTour] Activando tour con 7 pasos
```

### 2. Verifica que los Selectores CSS Existen

El tour necesita que estos elementos existan en el DOM:

**Para Estudiantes:**
- ✅ `.theme-toggle` - Botón de cambio de tema
- ✅ `.notification-bell` - Campana de notificaciones (ARREGLADO)
- ✅ `.dashboard-title` - Título del dashboard
- ✅ `.stats-grid-responsive` - Grid de estadísticas
- ✅ `.subjects-grid-responsive` - Grid de materias

**Para Profesores:**
- ✅ `.theme-toggle`
- ✅ `.notification-bell` (ARREGLADO)
- ✅ `.dashboard-title`
- ✅ `.stats-grid`
- ✅ `.data-table`
- ✅ `a[href="/subjects"]`

Puedes verificar en DevTools > Elements buscando estas clases.

## Troubleshooting

### El tour no aparece

1. **Verifica la autenticación**: Debes estar logueado
2. **Verifica la ruta**: Debes estar en `/` (no `/profile`, `/subjects`, etc.)
3. **Limpia localStorage**: Ejecuta `localStorage.clear()` en consola
4. **Verifica la consola**: Busca logs de `[AppTour]` o errores
5. **Recarga duro**: Ctrl + F5 o Ctrl + Shift + R

### El tour se salta pasos

- **Causa**: Un elemento objetivo no existe en el DOM
- **Solución**: Revisa la consola, probablemente veas `TARGET_NOT_FOUND`
- **Acción**: Verifica que todas las clases CSS existan

### El tour no se guarda como completado

- **Causa**: El callback no está ejecutándose correctamente
- **Solución**: Revisa que aparezca en consola:
  ```
  [AppTour] Tour completado/saltado
  [AppTour] Guardado en localStorage: aulaaldia-tour-completed-STUDENT
  ```

### El delay es muy largo

Si quieres que el tour aparezca más rápido para pruebas:

1. Edita `frontend/src/components/AppTour.jsx`
2. Busca la línea `setTimeout(() => { ... }, 2000)`
3. Cambia `2000` a `500` (medio segundo)

## Comandos de Desarrollo

```bash
# Iniciar frontend
cd frontend
npm run dev

# Limpiar caché de Vite (si hay problemas)
npm run build -- --force

# Ver en tiempo real
# Abre: http://localhost:5173
```

## Verificación Post-Fix

Después del fix de agregar la clase `notification-bell`:

1. ✅ Componente `NotificationBell` tiene la clase CSS
2. ✅ Tour puede encontrar el elemento de notificaciones
3. ✅ Ya no se debe saltar el paso de notificaciones
4. ✅ Delay de 2 segundos permite que todo el DOM cargue

## Más Información

- Ver documentación completa: `docs/APP_TOUR.md`
- Código del tour: `frontend/src/components/AppTour.jsx`
- Integración en navbar: `frontend/src/components/NavBar.jsx`
- Botón de reset: `frontend/src/pages/UserProfile.jsx` (línea ~611)
