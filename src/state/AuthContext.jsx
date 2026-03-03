import React, { createContext, useContext, useEffect, useState } from 'react'
import { api, setApiActiveTenantId } from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [access, setAccess] = useState(null)
  const [refresh, setRefresh] = useState(null)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [lastLoginAt, setLastLoginAt] = useState(null)
  const [lastLoginIp, setLastLoginIp] = useState(null)
  const [activeTenantId, setActiveTenantId] = useState(null)
  const [tenants, setTenants] = useState([])

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
    }
  }, [])

  // Auto-logout por inactividad
  useEffect(() => {
    if (!user) return

    const timeout = (user.session_timeout || 30) * 60 * 1000 // Convertir minutos a ms
    
    const checkInactivity = setInterval(() => {
      const now = Date.now()
      const inactive = now - lastActivity
      
      if (inactive >= timeout) {
        console.log('⏱️ Sesión cerrada por inactividad')
        logout()
      }
    }, 60000) // Verificar cada minuto

    // Detectar actividad del usuario
    const updateActivity = () => setLastActivity(Date.now())
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      window.addEventListener(event, updateActivity)
    })

    return () => {
      clearInterval(checkInactivity)
      events.forEach(event => {
        window.removeEventListener(event, updateActivity)
      })
    }
  }, [user, lastActivity])

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
    setLastActivity(Date.now()) // Resetear actividad al guardar auth
  }

  async function fetchMyTenants() {
    if (!access) {
      setTenants([])
      return
    }

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

  function logout() {
    localStorage.removeItem('auth')
    setUser(null)
    setAccess(null)
    setRefresh(null)
    setActiveTenantId(null)
    setTenants([])
    setApiActiveTenantId(null)
  }

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
    const currentAuth = JSON.parse(localStorage.getItem('auth') || '{}')
    const newAuth = { ...currentAuth, active_tenant_id: normalizedTenantId }
    localStorage.setItem('auth', JSON.stringify(newAuth))
    setActiveTenantId(normalizedTenantId)
    setApiActiveTenantId(normalizedTenantId)
  }

  async function switchTenant(tenantId) {
    if (!tenantId) return

    await api.post('/api/v1/auth/select-tenant/', { tenant_id: tenantId })
    updateActiveTenant(tenantId)
    await refreshMe()
    await fetchMyTenants()
  }

  useEffect(() => {
    if (!user || !access) {
      setTenants([])
      return
    }

    fetchMyTenants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, access])

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
    tenants,
    login, 
    googleLogin,
    register, 
    logout, 
    updateUser, 
    updateActiveTenant,
    switchTenant,
    refreshMe,
    fetchMyTenants,
    lastActivity 
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
