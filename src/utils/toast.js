/**
 * Sistema de notificaciones Toast
 * Permite mostrar alertas elegantes y animadas en cualquier parte de la aplicación
 */

const toastStyles = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    pointer-events: none;
  }

  .toast {
    pointer-events: auto;
    margin-bottom: 1rem;
    animation: slideInRight 0.5s ease;
  }

  .toast.removing {
    animation: slideOutRight 0.5s ease;
  }
`

// Inyectar estilos una sola vez
if (!document.getElementById('toast-styles')) {
  const styleSheet = document.createElement('style')
  styleSheet.id = 'toast-styles'
  styleSheet.textContent = toastStyles
  document.head.appendChild(styleSheet)
}

// Crear contenedor de toasts si no existe
function getToastContainer() {
  let container = document.getElementById('toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'toast-container'
    container.className = 'toast-container'
    document.body.appendChild(container)
  }
  return container
}

/**
 * Tipos de toast predefinidos
 */
const toastTypes = {
  success: {
    icon: '✅',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    title: 'Éxito'
  },
  error: {
    icon: '❌',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    title: 'Error'
  },
  warning: {
    icon: '⚠️',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    title: 'Advertencia'
  },
  info: {
    icon: 'ℹ️',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    title: 'Información'
  },
  security: {
    icon: '🔐',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    title: 'Seguridad'
  }
}

/**
 * Muestra una notificación toast
 * @param {Object} options - Opciones de configuración
 * @param {string} options.type - Tipo de toast: 'success', 'error', 'warning', 'info', 'security'
 * @param {string} options.title - Título del toast (opcional, usa el del tipo por defecto)
 * @param {string} options.message - Mensaje principal
 * @param {string} options.subtitle - Subtítulo o mensaje secundario (opcional)
 * @param {number} options.duration - Duración en ms (default: 5000)
 * @param {boolean} options.closable - Si se puede cerrar manualmente (default: true)
 */
export function showToast({
  type = 'info',
  title,
  message,
  subtitle,
  duration = 5000,
  closable = true
}) {
  const container = getToastContainer()
  const config = toastTypes[type] || toastTypes.info
  
  const toastDiv = document.createElement('div')
  toastDiv.className = 'toast'
  toastDiv.style.cssText = `
    background: ${config.gradient};
    color: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    font-family: system-ui, -apple-system, sans-serif;
  `
  
  const closeButton = closable ? `
    <button onclick="this.closest('.toast').classList.add('removing'); setTimeout(() => this.closest('.toast').remove(), 500)" 
      style="background: rgba(255,255,255,0.2); border: none; color: white; 
             border-radius: 50%; width: 28px; height: 28px; cursor: pointer;
             font-size: 1.2rem; display: flex; align-items: center; 
             justify-content: center; flex-shrink: 0; line-height: 1;
             transition: background 0.2s;"
      onmouseover="this.style.background='rgba(255,255,255,0.3)'"
      onmouseout="this.style.background='rgba(255,255,255,0.2)'">
      ×
    </button>
  ` : ''
  
  toastDiv.innerHTML = `
    <div style="display: flex; align-items: start; gap: 1rem;">
      <div style="font-size: 2rem; flex-shrink: 0; line-height: 1;">${config.icon}</div>
      <div style="flex: 1; min-width: 0;">
        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 600;">
          ${title || config.title}
        </h3>
        <p style="margin: 0; font-size: 0.9rem; line-height: 1.4; opacity: 0.95;">
          ${message}
        </p>
        ${subtitle ? `
          <p style="margin: 0.75rem 0 0 0; font-size: 0.8rem; opacity: 0.85; line-height: 1.3;">
            ${subtitle}
          </p>
        ` : ''}
      </div>
      ${closeButton}
    </div>
  `
  
  container.appendChild(toastDiv)
  
  // Auto-cerrar
  if (duration > 0) {
    setTimeout(() => {
      if (toastDiv.parentElement) {
        toastDiv.classList.add('removing')
        setTimeout(() => toastDiv.remove(), 500)
      }
    }, duration)
  }
  
  return toastDiv
}

/**
 * Atajos para tipos comunes de toast
 */
export const toast = {
  success: (message, options = {}) => showToast({ type: 'success', message, ...options }),
  error: (message, options = {}) => showToast({ type: 'error', message, ...options }),
  warning: (message, options = {}) => showToast({ type: 'warning', message, ...options }),
  info: (message, options = {}) => showToast({ type: 'info', message, ...options }),
  security: (message, options = {}) => showToast({ type: 'security', message, ...options })
}

/**
 * Toast específico para cambio de contraseña
 */
export function showPasswordChangeToast() {
  return showToast({
    type: 'security',
    title: ' Contraseña Actualizada',
    message: 'Tu contraseña se actualizó exitosamente.',
    subtitle: '',
    duration: 8000
  })
}

export default toast
