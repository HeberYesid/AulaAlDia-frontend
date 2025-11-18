import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import NotificationBell from './NotificationBell'

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  function onLogout() {
    logout()
    navigate('/login')
    setMenuOpen(false)
  }

  function isActive(path) {
    return location.pathname === path
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="navbar">
      <div className="navbar-content">
        <div className="brand">
          <Link to="/" onClick={closeMenu}>
            <span>📊</span>
            <span className="brand-text">DevTrack</span>
          </Link>
        </div>
        
        {/* Hamburger button - solo visible en móvil */}
        {user && (
          <button 
            className={`hamburger-btn ${menuOpen ? 'menu-open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
          >
            <span>☰</span>
          </button>
        )}

        <nav className={menuOpen ? 'nav-open' : ''}>
          {user ? (
            <>
              {/* Botón de cerrar dentro del menú - solo móvil */}
              <button 
                className="close-menu-btn"
                onClick={closeMenu}
                aria-label="Cerrar menú"
              >
                ✕
              </button>
              
              <Link 
                to="/" 
                className={isActive('/') ? 'active' : ''}
                onClick={closeMenu}
              >
                🏠 Dashboard
              </Link>
              {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
                <Link 
                  to="/subjects" 
                  className={isActive('/subjects') ? 'active' : ''}
                  onClick={closeMenu}
                >
                  📚 Materias
                </Link>
              )}
              {user.role === 'STUDENT' && (
                <Link 
                  to="/my" 
                  className={isActive('/my') ? 'active' : ''}
                  onClick={closeMenu}
                >
                  📈 Mis Resultados
                </Link>
              )}
              <div className="nav-icons">
                <NotificationBell />
                <ThemeToggle />
              </div>
              <Link 
                to="/profile" 
                className={`user-link ${isActive('/profile') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <span className="user-email">👤 {user.email}</span>
                <span className="role-badge">{user.role}</span>
              </Link>
              <button onClick={onLogout} className="btn danger logout-btn">
                🚪 Salir
              </button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link to="/login" onClick={closeMenu}>Iniciar sesión</Link>
              <Link to="/register" onClick={closeMenu}>Registrarse</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
