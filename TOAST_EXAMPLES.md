# 🎨 Ejemplos de Toasts

## Uso Básico

```javascript
import { toast } from '../utils/toast'

// Simple
toast.success('Guardado correctamente')
toast.error('Algo salió mal')
toast.warning('Ten cuidado')
toast.info('Información importante')
toast.security('Acción de seguridad')

// Con opciones
toast.success('Perfil actualizado', {
  subtitle: 'Los cambios se guardaron',
  duration: 5000
})
```

## Login

```javascript
async function handleLogin(e) {
  try {
    await api.post('/api/auth/login/', { email, password })
    toast.success('Bienvenido! 👋')
    navigate('/dashboard')
  } catch (err) {
    if (err.response?.status === 429) {
      toast.error('Demasiados intentos', {
        subtitle: 'Espera 5 minutos'
      })
    } else {
      toast.error('Credenciales incorrectas')
    }
  }
}
```

## Guardar Datos

```javascript
async function handleSave() {
  try {
    await api.post('/api/data/', data)
    toast.success('Datos guardados')
  } catch (err) {
    toast.error('Error al guardar', {
      subtitle: err.response?.data?.detail
    })
  }
}
```

## Subir Archivos

```javascript
async function handleUpload(file) {
  if (file.size > 10 * 1024 * 1024) {
    toast.warning('Archivo muy grande', {
      subtitle: 'Máximo 10MB'
    })
    return
  }
  
  try {
    await api.post('/api/files/', formData)
    toast.success('Archivo subido 📎')
  } catch (err) {
    toast.error('Error al subir archivo')
  }
}
```

## Eliminar

```javascript
async function handleDelete(id) {
  if (!confirm('¿Eliminar?')) return
  
  try {
    await api.delete(`/api/items/${id}/`)
    toast.warning('Elemento eliminado 🗑️')
    reloadList()
  } catch (err) {
    toast.error('No se pudo eliminar')
  }
}
```

## Sesión

```javascript
// Sesión expirando
toast.warning('Tu sesión expirará pronto', {
  title: '⏰ Advertencia',
  subtitle: 'Guarda tu trabajo',
  duration: 10000
})

// Sesión expirada
toast.error('Sesión expirada', {
  subtitle: 'Inicia sesión nuevamente'
})
```

## Ver más

Archivo completo: `frontend/src/utils/toast.js`
