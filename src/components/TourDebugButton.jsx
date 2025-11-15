import { useAuth } from '../state/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function TourDebugButton() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [tourStatus, setTourStatus] = useState('❓')

  useEffect(() => {
    if (user) {
      const tourKey = `devtrack-tour-completed-${user.role}`
      const completed = localStorage.getItem(tourKey)
      setTourStatus(completed ? '✅' : '❌')
    }
  }, [user, location])

  const resetAndShowTour = () => {
    if (user) {
      const tourKey = `devtrack-tour-completed-${user.role}`
      localStorage.removeItem(tourKey)
      console.log('[TourDebug] Tour reset for role:', user.role)
      console.log('[TourDebug] Removed key:', tourKey)
      
      // Mostrar confirmación
      alert(`✅ Tour reseteado para ${user.role}.\n\nRecargando página para mostrar el tour...`)
      
      // Si ya estamos en dashboard, recargar, si no, navegar
      if (location.pathname === '/') {
        window.location.reload()
      } else {
        window.location.href = '/'
      }
    }
  }

  const checkTourStatus = () => {
    if (user) {
      const tourKey = `devtrack-tour-completed-${user.role}`
      const completed = localStorage.getItem(tourKey)
      const allTourKeys = Object.keys(localStorage).filter(k => k.includes('tour'))
      
      console.log('[TourDebug] Full Status:', {
        role: user.role,
        tourKey,
        completed: completed ? 'SÍ' : 'NO',
        completedValue: completed,
        allTourKeys,
        pathname: location.pathname,
        isAuthenticated: !!user
      })
      
      alert(
        `📊 Estado del Tour\n\n` +
        `Rol: ${user.role}\n` +
        `Key: ${tourKey}\n` +
        `Estado: ${completed ? '✅ COMPLETADO' : '❌ NO COMPLETADO'}\n` +
        `Valor: ${completed || 'null'}\n` +
        `Ubicación: ${location.pathname}\n\n` +
        `Keys relacionadas: ${allTourKeys.length > 0 ? allTourKeys.join(', ') : 'Ninguna'}`
      )
    }
  }

  // Solo mostrar en desarrollo
  if (import.meta.env.MODE !== 'development') {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      background: 'var(--bg-card)',
      padding: '15px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      border: '2px solid var(--primary)'
    }}>
      <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
        🔧 Tour Debug {tourStatus}
      </div>
      <button 
        onClick={resetAndShowTour}
        style={{
          padding: '8px 12px',
          fontSize: '12px',
          borderRadius: '6px',
          border: 'none',
          background: 'var(--primary)',
          color: 'white',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        🔄 Resetear Tour
      </button>
      <button 
        onClick={checkTourStatus}
        style={{
          padding: '8px 12px',
          fontSize: '12px',
          borderRadius: '6px',
          border: '1px solid var(--border-primary)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        ℹ️ Ver Estado
      </button>
    </div>
  )
}
