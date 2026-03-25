import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { useState, useEffect } from 'react'
import NotificationBell from './NotificationBell'
import { getBrandInitials } from '../utils/branding'
import {
  LayoutDashboard,
  BookOpen,
  BookMarked,
  BarChart2,
  MessageSquare,
  Calendar,
  ClipboardList,
  UserX,
  FileText,
  ShieldCheck,
  SlidersHorizontal,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Megaphone,
} from 'lucide-react'

const SIDEBAR_COLLAPSED_KEY = 'aulaaldia-sidebar-collapsed'

export default function Sidebar() {
  const {
    user,
    logout,
    activeTenantBranding,
  } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showLogoImage, setShowLogoImage] = useState(true)

  const [collapsed, setCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
      // Set class immediately on initial render to avoid layout flash
      if (stored) document.body.classList.add('sidebar-collapsed')
      return stored
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  // Sync has-sidebar body class — lets public pages opt out of sidebar margin
  useEffect(() => {
    document.body.classList.toggle('has-sidebar', !!user)
  }, [user])

  // Sync body class and persist collapsed state
  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', collapsed)
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
    } catch {
      // ignore
    }
  }, [collapsed])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Close mobile sidebar on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  useEffect(() => {
    setShowLogoImage(true)
  }, [activeTenantBranding.sidebarLogoUrl])

  function onLogout() {
    logout()
    navigate('/login')
  }

  function isActive(path) {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Don't render sidebar on public/auth pages
  if (!user) return null

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: user.role !== 'ADMIN',
    },
    {
      to: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: user.role === 'ADMIN',
    },
    {
      to: '/admin/news',
      label: 'Gestión de Novedades',
      icon: Megaphone,
      show: user.role === 'ADMIN',
    },
    {
      to: '/subjects',
      label: 'Materias',
      icon: BookOpen,
      show: user.role === 'TEACHER' || user.role === 'ADMIN',
    },
    {
      to: '/my',
      label: user.role === 'TUTOR' ? 'Progreso' : 'Resultados',
      icon: BarChart2,
      show: user.role === 'STUDENT' || user.role === 'TUTOR',
    },
    {
      to: '/my-subjects',
      label: 'Mis Materias',
      icon: BookMarked,
      show: user.role === 'STUDENT' || user.role === 'TUTOR',
    },
    {
      to: '/my-bulletins',
      label: 'Boletines',
      icon: FileText,
      show: user.role === 'STUDENT' || user.role === 'TUTOR',
    },
    {
      to: '/messages',
      label: 'Mensajes',
      icon: MessageSquare,
      show: user.role !== 'TUTOR',
    },
    {
      to: '/calendar',
      label: 'Calendario',
      icon: Calendar,
      show: true,
    },
    {
      to: '/observer',
      label: 'Observador',
      icon: ClipboardList,
      show: true,
    },
    {
      to: '/absences',
      label: 'Asistencia',
      icon: UserX,
      show: true,
    },
    {
      to: '/admin/operations',
      label: 'Auditoría',
      icon: ClipboardList,
      show: user.role === 'ADMIN',
    },
    {
      to: '/admin/commercial',
      label: 'Comercial Tenant',
      icon: ShieldCheck,
      show: user.role === 'ADMIN' && user.is_global_admin,
    },
    {
      to: '/admin/academic-settings',
      label: 'Config. Académica',
      icon: SlidersHorizontal,
      show: user.role === 'ADMIN',
    },
    {
      to: '/admin/curriculums',
      label: 'Mallas Curriculares',
      icon: BookOpen,
      show: user.role === 'ADMIN',
    },
    {
      to: '/admin/grade-levels',
      label: 'Grados',
      icon: LayoutDashboard,
      show: user.role === 'ADMIN',
    },
    {
      to: '/admin/sections',
      label: 'Secciones',
      icon: LayoutDashboard,
      show: user.role === 'ADMIN',
    },
    {
      to: '/admin/courses',
      label: 'Cursos',
      icon: BookOpen,
      show: user.role === 'ADMIN',
    },
  ].filter((item) => item.show)

  const sidebarClasses = [
    'sidebar',
    collapsed ? 'sidebar--collapsed' : '',
    mobileOpen ? 'sidebar--mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const brandName = activeTenantBranding.displayName
  const logoInitials = getBrandInitials(brandName)
  const logoUrl = activeTenantBranding.sidebarLogoUrl
  const showImageLogo = Boolean(logoUrl) && showLogoImage

  return (
    <>
      {/* Mobile hamburger — fixed top-left, only visible on mobile */}
      <button
        className="sidebar-hamburger"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={mobileOpen}
        aria-controls="sidebar"
      >
        <Menu size={22} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      <aside id="sidebar" className={sidebarClasses} aria-label="Navegación principal">
        {/* Brand + collapse toggle */}
        <div className="sidebar__brand">
          <Link to="/" className="sidebar__logo" aria-label={`${brandName} — Inicio`}>
            {showImageLogo ? (
              <img
                src={logoUrl}
                className="sidebar__logo-image"
                alt={`Logo de ${brandName}`}
                width="32"
                height="32"
                onError={() => setShowLogoImage(false)}
              />
            ) : (
              <span className="sidebar__logo-icon">{logoInitials}</span>
            )}
            {!collapsed && <span className="sidebar__logo-text">{brandName}</span>}
          </Link>

          {/* Close button on mobile */}
          <button
            className="sidebar__close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>

          {/* Collapse toggle — desktop only */}
          <button
            className="sidebar__collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            title={collapsed ? 'Expandir' : 'Colapsar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Main navigation */}
        <nav id="sidebar-nav" className="sidebar__nav" aria-label="Navegación">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`sidebar__nav-item ${isActive(to) ? 'sidebar__nav-item--active' : ''}`}
              aria-current={isActive(to) ? 'page' : undefined}
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
            >
              <span className="sidebar__nav-icon">
                <Icon size={20} strokeWidth={1.75} />
              </span>
              {!collapsed && <span className="sidebar__nav-label">{label}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom: notifications + profile + logout */}
        <div className="sidebar__footer">
          <NotificationBell sidebarMode={true} collapsed={collapsed} />
          <Link
            to="/profile"
            className={`sidebar__nav-item sidebar__profile ${isActive('/profile') ? 'sidebar__nav-item--active' : ''}`}
            aria-current={isActive('/profile') ? 'page' : undefined}
            title={collapsed ? 'Perfil' : undefined}
          >
            <span className="sidebar__nav-icon">
              <User size={20} strokeWidth={1.75} />
            </span>
            {!collapsed && (
              <span className="sidebar__nav-label">
                {user.first_name ? user.first_name : 'Perfil'}
              </span>
            )}
          </Link>

          <button
            className="sidebar__nav-item sidebar__logout"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            title={collapsed ? 'Salir' : undefined}
          >
            <span className="sidebar__nav-icon">
              <LogOut size={20} strokeWidth={1.75} />
            </span>
            {!collapsed && <span className="sidebar__nav-label">Salir</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
