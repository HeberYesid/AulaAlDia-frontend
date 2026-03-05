import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

const NAV_LINKS = [
  { label: 'Características', scrollId: 'features' },
  { label: 'Cómo funciona', scrollId: 'how-it-works' },
  { label: 'Planes', scrollId: 'pricing' },
]

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export default function PublicNavBar() {
  const { isAuthenticated } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  // Track scroll to add background when user scrolls down
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  function handleNavClick(scrollId) {
    if (location.pathname === '/home') {
      scrollToSection(scrollId)
    } else {
      // Navigate to /home then scroll after load
      window.location.href = `/home#${scrollId}`
    }
    setMobileOpen(false)
  }

  return (
    <header
      className={`public-navbar${scrolled ? ' public-navbar--scrolled' : ''}`}
      role="banner"
    >
      <div className="public-navbar__inner">
        {/* Logo */}
        <Link to="/home" className="public-navbar__logo" aria-label="AulaAlDía — Inicio">
          <span className="public-navbar__logo-icon" aria-hidden="true">DT</span>
          <span className="public-navbar__logo-text">AulaAlDía</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="public-navbar__links" aria-label="Secciones de la página">
          {NAV_LINKS.map(({ label, scrollId }) => (
            <button
              key={scrollId}
              onClick={() => handleNavClick(scrollId)}
              className="public-navbar__link"
            >
              {label}
            </button>
          ))}
          <Link to="/faq" className="public-navbar__link">FAQ</Link>
          <Link to="/contact" className="public-navbar__link">Contacto</Link>
        </nav>

        {/* CTA buttons — desktop */}
        <div className="public-navbar__cta">
          {isAuthenticated ? (
            <Link to="/" className="btn btn-primary public-navbar__cta-btn">
              Ir al Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="public-navbar__login">Iniciar Sesión</Link>
              <Link to="/register" className="btn btn-primary public-navbar__cta-btn">
                Registrarse
              </Link>
            </>
          )}
        </div>

        {/* Hamburger — mobile only */}
        <button
          className="public-navbar__hamburger"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
          aria-controls="public-mobile-menu"
        >
          <span className="public-navbar__hamburger-icon" aria-hidden="true">
            {mobileOpen ? '✕' : '☰'}
          </span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav
          id="public-mobile-menu"
          className="public-navbar__mobile-menu"
          aria-label="Menú móvil"
        >
          {NAV_LINKS.map(({ label, scrollId }) => (
            <button
              key={scrollId}
              onClick={() => handleNavClick(scrollId)}
              className="public-navbar__mobile-link"
            >
              {label}
            </button>
          ))}
          <Link
            to="/faq"
            className="public-navbar__mobile-link"
            onClick={() => setMobileOpen(false)}
          >
            FAQ
          </Link>
          <Link
            to="/contact"
            className="public-navbar__mobile-link"
            onClick={() => setMobileOpen(false)}
          >
            Contacto
          </Link>
          <div className="public-navbar__mobile-cta">
            {isAuthenticated ? (
              <Link
                to="/"
                className="btn btn-primary"
                onClick={() => setMobileOpen(false)}
              >
                Ir al Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-outline"
                  onClick={() => setMobileOpen(false)}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
