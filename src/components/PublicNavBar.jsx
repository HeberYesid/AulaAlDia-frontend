import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { getBrandInitials } from '../utils/branding'

const NAV_LINKS = [
  { label: 'Características', scrollId: 'features' },
  { label: 'Cómo funciona', scrollId: 'how-it-works' },
  { label: 'Planes', scrollId: 'pricing' },
  { label: 'Waitlist', scrollId: 'waitlist' },
]

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function getSectionHref(pathname, id) {
  return pathname === '/home' ? `#${id}` : `/home#${id}`
}

export default function PublicNavBar() {
  const { isAuthenticated, activeTenantBranding, activeTenantId } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showLogoImage, setShowLogoImage] = useState(true)
  const location = useLocation()
  const tenantIdFromQuery = new URLSearchParams(location.search).get('tenant_id')?.trim() || null
  const effectiveTenantId = tenantIdFromQuery || activeTenantId || null
  const authQuerySuffix = effectiveTenantId ? `?tenant_id=${encodeURIComponent(effectiveTenantId)}` : ''

  const brandName = activeTenantBranding.displayName
  const logoUrl = activeTenantBranding.sidebarLogoUrl
  const logoInitials = getBrandInitials(brandName)

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

  useEffect(() => {
    setShowLogoImage(true)
  }, [logoUrl])

  function handleNavClick(event, scrollId) {
    setMobileOpen(false)
    if (location.pathname === '/home') {
      event.preventDefault()
      scrollToSection(scrollId)
      window.history.replaceState(null, '', `#${scrollId}`)
    }
  }

  return (
    <header
      className={`public-navbar${scrolled ? ' public-navbar--scrolled' : ''}`}
      role="banner"
    >
      <div className="public-navbar__inner">
        {/* Logo */}
        <Link to="/home" className="public-navbar__logo" aria-label={`${brandName} — Inicio`}>
          {logoUrl && showLogoImage ? (
            <img
              src={logoUrl}
              className="public-navbar__logo-image"
              alt={`Logo de ${brandName}`}
              width="32"
              height="32"
              onError={() => setShowLogoImage(false)}
            />
          ) : (
            <span className="public-navbar__logo-icon" aria-hidden="true">{logoInitials}</span>
          )}
          <span className="public-navbar__logo-text">{brandName}</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="public-navbar__links" aria-label="Secciones de la página">
          {NAV_LINKS.map(({ label, scrollId }) => (
            <a
              key={scrollId}
              href={getSectionHref(location.pathname, scrollId)}
              onClick={(event) => handleNavClick(event, scrollId)}
              className="public-navbar__link"
            >
              {label}
            </a>
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
              <Link to={`/login${authQuerySuffix}`} className="public-navbar__login">Iniciar Sesión</Link>
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
            <a
              key={scrollId}
              href={getSectionHref(location.pathname, scrollId)}
              onClick={(event) => handleNavClick(event, scrollId)}
              className="public-navbar__mobile-link"
            >
              {label}
            </a>
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
                  to={`/login${authQuerySuffix}`}
                  className="btn btn-outline"
                  onClick={() => setMobileOpen(false)}
                >
                  Iniciar Sesión
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
