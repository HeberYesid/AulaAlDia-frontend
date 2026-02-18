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
        
        {/* Hamburger button - solo visible en móvil */}
        <button 
          className={`hamburger-btn ${menuOpen ? 'menu-open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"          aria-expanded={menuOpen}
          aria-controls="main-nav"        >
          <span>☰</span>
        </button>

        {/* Overlay para cerrar menú al hacer click fuera */}
        {menuOpen && (
          <div className="menu-overlay" onClick={closeMenu}></div>
        )}

        <nav id="main-nav" className={menuOpen ? 'nav-open' : ''} aria-label="Navegación principal">
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
                aria-current={isActive('/') ? 'page' : undefined}
                onClick={closeMenu}
              >
                Dashboard
              </Link>
              {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
                <Link 
                  to="/subjects" 
                  className={isActive('/subjects') ? 'active' : ''}
                  aria-current={isActive('/subjects') ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  Materias
                </Link>
              )}
              {user.role === 'STUDENT' && (
                <Link 
                  to="/my" 
                  className={isActive('/my') ? 'active' : ''}
                  aria-current={isActive('/my') ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  Resultados
                </Link>
              )}
              <Link 
                to="/messages" 
                className={isActive('/messages') ? 'active' : ''}
                aria-current={isActive('/messages') ? 'page' : undefined}
                onClick={closeMenu}
              >
                Mensajes
              </Link>
              <Link 
                to="/calendar" 
                className={isActive('/calendar') ? 'active' : ''}
                aria-current={isActive('/calendar') ? 'page' : undefined}
                onClick={closeMenu}
              >
                Calendario
              </Link>
              <div className="nav-icons">
                <NotificationBell />
                <ThemeToggle />
              </div>
              <Link 
                to="/profile" 
                className={`user-link ${isActive('/profile') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <span className="user-email">Perfil</span>
              </Link>
              <button onClick={onLogout} className="btn danger logout-btn">
                Salir</button>
            </>
          ) : (
            <>
              <Link to="/home" onClick={closeMenu}>Inicio</Link>
              <Link to="/faq" onClick={closeMenu}>FAQ</Link>
              <Link to="/contact" onClick={closeMenu}>Contacto</Link>
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
