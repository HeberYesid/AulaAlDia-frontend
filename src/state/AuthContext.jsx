import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [access, setAccess] = useState(null)
  const [refresh, setRefresh] = useState(null)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [lastLoginAt, setLastLoginAt] = useState(null)
  const [lastLoginIp, setLastLoginIp] = useState(null)

  useEffect(() => {
    const raw = localStorage.getItem('auth')
    if (raw) {
      const data = JSON.parse(raw)
      setUser(data.user || null)
      setAccess(data.access || null)
      setRefresh(data.refresh || null)
      setLastLoginAt(data.last_login_at || null)
      setLastLoginIp(data.last_login_ip || null)
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

  function saveAuth({ user, access, refresh, last_login_at, last_login_ip }) {
    const payload = { user, access, refresh, last_login_at, last_login_ip }
    localStorage.setItem('auth', JSON.stringify(payload))
    setUser(user)
    setAccess(access)
    setRefresh(refresh)
    setLastLoginAt(last_login_at || null)
    setLastLoginIp(last_login_ip || null)
    setLastActivity(Date.now()) // Resetear actividad al guardar auth
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
  }

  // Función para actualizar el usuario (después de cambiar configuración)
  function updateUser(updatedUser) {
    const currentAuth = JSON.parse(localStorage.getItem('auth') || '{}')
    const newAuth = { ...currentAuth, user: updatedUser }
    localStorage.setItem('auth', JSON.stringify(newAuth))
    setUser(updatedUser)
  }

  // Computed value para saber si está autenticado
  const isAuthenticated = !!user

  const value = { 
    user, 
    access, 
    refresh, 
    isAuthenticated,
    lastLoginAt,
    lastLoginIp,
    login, 
    googleLogin,
    register, 
    logout, 
    updateUser, 
    lastActivity 
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
