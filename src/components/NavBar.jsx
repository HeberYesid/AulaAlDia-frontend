import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import NotificationBell from './NotificationBell'
import { getNavigationItems } from '../utils/navigation'

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
    if (path === '/') return location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  const navItems = user ? getNavigationItems(user, { surface: 'navbar' }) : []

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
          <button
            type="button"
            className="menu-overlay"
            onClick={closeMenu}
            aria-label="Cerrar menú"
          ></button>
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

              {navItems.map(({ key, to, label, tourId }) => (
                <Link
                  key={key}
                  to={to}
                  className={isActive(to) ? 'active' : ''}
                  aria-current={isActive(to) ? 'page' : undefined}
                  onClick={closeMenu}
                  data-tour-id={tourId || undefined}
                >
                  {label}
                </Link>
              ))}
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
