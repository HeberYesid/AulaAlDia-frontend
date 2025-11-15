import { useAuth } from '../state/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

export default function TourDebugButton() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const resetAndShowTour = () => {
    if (user) {
      const tourKey = `devtrack-tour-completed-${user.role}`
      localStorage.removeItem(tourKey)
      console.log('[TourDebug] Tour reset for role:', user.role)
      
      // Si ya estamos en dashboard, recargar, si no, navegar
      if (location.pathname === '/') {
        window.location.reload()
      } else {
        navigate('/')
      }
    }
  }

  const checkTourStatus = () => {
    if (user) {
      const tourKey = `devtrack-tour-completed-${user.role}`
      const completed = localStorage.getItem(tourKey)
      console.log('[TourDebug] Status:', {
        role: user.role,
        tourKey,
        completed: completed ? 'SÍ' : 'NO',
        localStorage: Object.keys(localStorage).filter(k => k.includes('tour'))
      })
      alert(`Tour para ${user.role}: ${completed ? 'COMPLETADO' : 'NO COMPLETADO'}`)
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
        🔧 Tour Debug
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
