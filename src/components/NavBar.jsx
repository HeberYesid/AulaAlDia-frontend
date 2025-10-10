import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import ThemeToggle from './ThemeToggle'
import NotificationBell from './NotificationBell'

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function onLogout() {
    logout()
    navigate('/login')
  }

  function isActive(path) {
    return location.pathname === path
  }

  return (
    <header className="navbar">
      <div className="navbar-content">
        <div className="brand">
          <Link to="/">
            <span>📊</span>
            <span className="brand-text">DevTrack</span>
          </Link>
        </div>
        <nav>
          {user ? (
            <>
              <Link 
                to="/" 
                className={isActive('/') ? 'active' : ''}
              >
                🏠 Dashboard
              </Link>
              {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
                <Link 
                  to="/subjects" 
                  className={isActive('/subjects') ? 'active' : ''}
                >
                  📚 Materias
                </Link>
              )}
              {user.role === 'STUDENT' && (
                <Link 
                  to="/my" 
                  className={isActive('/my') ? 'active' : ''}
                >
                  📈 Mis Resultados
                </Link>
              )}
              <NotificationBell />
              <ThemeToggle />
              <Link 
                to="/profile" 
                className={isActive('/profile') ? 'active' : ''}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-primary)'
                }}
              >
                <span>👤 {user.email}</span>
                <span className="role-badge">{user.role}</span>
              </Link>
              <button onClick={onLogout} className="btn danger">
                🚪 Salir
              </button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link to="/login">Iniciar sesión</Link>
              <Link to="/register">Registrarse</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
