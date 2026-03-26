import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api, AUTH_INVALIDATED_EVENT, setApiActiveTenantId } from '../api/axios'

const AuthContext = createContext(null)

const DEFAULT_BRANDING = {
  displayName: 'AulaAlDía',
  sidebarLogoUrl: '',
  faviconUrl: '/favicon.svg',
  primaryColor: '#c97b2f',
  accentColor: '#f2c572',
}

function normalizeHexColor(color) {
  if (typeof color !== 'string') return null
  const trimmed = color.trim()

  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed

  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1]
    const g = trimmed[2]
    const b = trimmed[3]
    return `#${r}${r}${g}${g}${b}${b}`
  }

  return null
}

function shiftHexColor(hexColor, amount) {
  const normalized = normalizeHexColor(hexColor)
  if (!normalized) return hexColor

  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)

  const applyShift = (channel) => {
    if (amount >= 0) {
      return Math.round(channel + (255 - channel) * amount)
    }
    return Math.round(channel * (1 + amount))
  }

  const toHex = (channel) => {
    const clamped = Math.max(0, Math.min(255, channel))
    return clamped.toString(16).padStart(2, '0')
  }

  return `#${toHex(applyShift(r))}${toHex(applyShift(g))}${toHex(applyShift(b))}`
}

function normalizeTenantBranding(tenant) {
  if (!tenant) return DEFAULT_BRANDING

  return {
    displayName: tenant.tenant_display_name || tenant.tenant_name || DEFAULT_BRANDING.displayName,
    sidebarLogoUrl: tenant.tenant_sidebar_logo_url || '',
    faviconUrl: tenant.tenant_favicon_url || DEFAULT_BRANDING.faviconUrl,
    primaryColor: tenant.tenant_primary_color || DEFAULT_BRANDING.primaryColor,
    accentColor: tenant.tenant_accent_color || DEFAULT_BRANDING.accentColor,
  }
}

function setDocumentFavicon(href) {
  const iconLinks = document.querySelectorAll('link[rel*="icon"]')
  if (iconLinks.length === 0) return

  iconLinks.forEach((linkEl) => {
    linkEl.setAttribute('href', href)
  })
}

function applyBrandingToDocument(branding) {
  const root = document.documentElement
  const primaryColor = branding?.primaryColor || DEFAULT_BRANDING.primaryColor
  const accentColor = branding?.accentColor || DEFAULT_BRANDING.accentColor

  root.style.setProperty('--primary', primaryColor)
  root.style.setProperty('--primary-light', shiftHexColor(primaryColor, 0.18))
  root.style.setProperty('--primary-dark', shiftHexColor(primaryColor, -0.18))
  root.style.setProperty('--accent', accentColor)
  document.title = branding.displayName
  setDocumentFavicon(branding.faviconUrl)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [access, setAccess] = useState(null)
  const [refresh, setRefresh] = useState(null)
  const [lastLoginAt, setLastLoginAt] = useState(null)
  const [lastLoginIp, setLastLoginIp] = useState(null)
  const [activeTenantId, setActiveTenantId] = useState(null)
  const [tenants, setTenants] = useState([])
  const [tenantsLoaded, setTenantsLoaded] = useState(false)
  const lastActivityRef = useRef(Date.now())

  function resolveTenantId({ user, active_tenant_id }, fallbackTenantId = null) {
    if (active_tenant_id) return active_tenant_id
    if (user?.active_tenant_id) return user.active_tenant_id
    if (user?.active_tenant?.public_id) return user.active_tenant.public_id
    if (fallbackTenantId) return fallbackTenantId
    return null
  }

  useEffect(() => {
    const raw = localStorage.getItem('auth')
    if (raw) {
      const data = JSON.parse(raw)
      setUser(data.user || null)
      setAccess(data.access || null)
      setRefresh(data.refresh || null)
      setLastLoginAt(data.last_login_at || null)
      setLastLoginIp(data.last_login_ip || null)
      const tenantId = resolveTenantId(data)
      setActiveTenantId(tenantId)
      setApiActiveTenantId(tenantId)
      lastActivityRef.current = Date.now()
    }
  }, [])

  function saveAuth({ user, access, refresh, last_login_at, last_login_ip, active_tenant_id }) {
    const tenantId = resolveTenantId(
      { user, active_tenant_id },
      activeTenantId
    )
    const payload = {
      user,
      access,
      refresh,
      last_login_at,
      last_login_ip,
      active_tenant_id: tenantId,
    }
    localStorage.setItem('auth', JSON.stringify(payload))
    setUser(user)
    setAccess(access)
    setRefresh(refresh)
    setLastLoginAt(last_login_at || null)
    setLastLoginIp(last_login_ip || null)
    setActiveTenantId(tenantId)
    setApiActiveTenantId(tenantId)
    lastActivityRef.current = Date.now()
  }

  function mergeAuthState(partialAuth) {
    const currentAuth = JSON.parse(localStorage.getItem('auth') || '{}')
    const nextAuth = { ...currentAuth, ...partialAuth }

    localStorage.setItem('auth', JSON.stringify(nextAuth))

    if (Object.prototype.hasOwnProperty.call(partialAuth, 'access')) {
      setAccess(nextAuth.access || null)
    }

    if (Object.prototype.hasOwnProperty.call(partialAuth, 'refresh')) {
      setRefresh(nextAuth.refresh || null)
    }

    if (Object.prototype.hasOwnProperty.call(partialAuth, 'active_tenant_id')) {
      const tenantId = nextAuth.active_tenant_id || null
      setActiveTenantId(tenantId)
      setApiActiveTenantId(tenantId)
    }

    return nextAuth
  }

  async function fetchMyTenants() {
    if (!access) {
      setTenants([])
      setTenantsLoaded(true)
      return
    }

    setTenantsLoaded(false)
    try {
      const { data } = await api.get('/api/v1/auth/my-tenants/')
      const tenantItems = Array.isArray(data?.tenants) ? data.tenants : []
      setTenants(tenantItems)

      const backendActiveTenantId = data?.active_tenant_id || null
      if (backendActiveTenantId && backendActiveTenantId !== activeTenantId) {
        updateActiveTenant(backendActiveTenantId)
      }
    } catch (error) {
      setTenants([])
    } finally {
      setTenantsLoaded(true)
    }
  }

  async function refreshMe() {
    try {
      const { data } = await api.get('/api/v1/auth/me/')
      updateUser(data)
      return data
    } catch (error) {
      return null
    }
  }

  async function login(email, password) {
    const { data } = await api.post('/api/v1/auth/login/', { email, password })
    saveAuth(data)
  }

  async function googleLogin(id_token) {
    const { data } = await api.post('/api/v1/auth/google-login/', { id_token })
    saveAuth(data)
    return data  // caller can read is_new_user
  }

  async function register(payload) {
    await api.post('/api/v1/auth/register/', payload)
  }

  const logout = useCallback(async () => {
    try {
      if (access) {
        await api.post('/api/v1/auth/logout/')
      }
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      localStorage.removeItem('auth')
      setUser(null)
      setAccess(null)
      setRefresh(null)
      setActiveTenantId(null)
      setTenants([])
      setTenantsLoaded(false)
      setApiActiveTenantId(null)
    }
  }, [access])

  useEffect(() => {
    const handleAuthInvalidated = () => {
      logout()
    }

    window.addEventListener(AUTH_INVALIDATED_EVENT, handleAuthInvalidated)

    return () => {
      window.removeEventListener(AUTH_INVALIDATED_EVENT, handleAuthInvalidated)
    }
  }, [logout])

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== 'auth') return

      if (event.newValue) return

      logout()
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [logout])

  useEffect(() => {
    if (!user) return

    const timeout = (user.session_timeout || 30) * 60 * 1000
    const updateActivity = () => {
      lastActivityRef.current = Date.now()
    }
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    updateActivity()

    const checkInactivity = window.setInterval(() => {
      const inactive = Date.now() - lastActivityRef.current

      if (inactive >= timeout) {
        console.log('⏱️ Sesión cerrada por inactividad')
        logout()
      }
    }, 60000)

    events.forEach((event) => {
      window.addEventListener(event, updateActivity)
    })

    return () => {
      window.clearInterval(checkInactivity)
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity)
      })
    }
  }, [user, logout])

  // Función para actualizar el usuario (después de cambiar configuración)
  function updateUser(updatedUser) {
    const currentAuth = JSON.parse(localStorage.getItem('auth') || '{}')
    const tenantId = resolveTenantId(
      { user: updatedUser, active_tenant_id: currentAuth.active_tenant_id },
      activeTenantId
    )
    const newAuth = { ...currentAuth, user: updatedUser, active_tenant_id: tenantId }
    localStorage.setItem('auth', JSON.stringify(newAuth))
    setUser(updatedUser)
    setActiveTenantId(tenantId)
    setApiActiveTenantId(tenantId)
  }

  function updateActiveTenant(tenantId) {
    const normalizedTenantId = tenantId || null
    mergeAuthState({ active_tenant_id: normalizedTenantId })
  }

  async function switchTenant(tenantId) {
    if (!tenantId) return

    const { data } = await api.post('/api/v1/auth/select-tenant/', { tenant_id: tenantId })

    mergeAuthState({
      access: data?.access,
      refresh: data?.refresh,
      active_tenant_id: data?.active_tenant_id || tenantId,
    })

    await refreshMe()
    await fetchMyTenants()
  }

  useEffect(() => {
    if (!user || !access) {
      setTenants([])
      setTenantsLoaded(false)
      return
    }

    fetchMyTenants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, access])

  const activeTenant = useMemo(() => {
    return (
      tenants.find((tenant) => tenant.tenant_id === activeTenantId) ||
      tenants[0] ||
      null
    )
  }, [tenants, activeTenantId])

  const activeTenantBranding = useMemo(() => {
    return normalizeTenantBranding(activeTenant)
  }, [activeTenant])

  useEffect(() => {
    if (!user) {
      applyBrandingToDocument(DEFAULT_BRANDING)
      return
    }

    applyBrandingToDocument(activeTenantBranding)
  }, [user, activeTenantBranding])

  // Computed value para saber si está autenticado
  const isAuthenticated = !!user

  const value = { 
    user, 
    access, 
    refresh, 
    isAuthenticated,
    lastLoginAt,
    lastLoginIp,
    activeTenantId,
    activeTenant,
    activeTenantBranding,
    tenants,
    tenantsLoaded,
    login, 
    googleLogin,
    register, 
    logout, 
    updateUser, 
    updateActiveTenant,
    switchTenant,
    refreshMe,
    fetchMyTenants,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
