import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [access, setAccess] = useState(null)
  const [refresh, setRefresh] = useState(null)

  useEffect(() => {
    const raw = localStorage.getItem('auth')
    if (raw) {
      const data = JSON.parse(raw)
      setUser(data.user || null)
      setAccess(data.access || null)
      setRefresh(data.refresh || null)
    }
  }, [])

  function saveAuth({ user, access, refresh }) {
    const payload = { user, access, refresh }
    localStorage.setItem('auth', JSON.stringify(payload))
    setUser(user)
    setAccess(access)
    setRefresh(refresh)
  }

  async function login(email, password) {
    const { data } = await api.post('/api/auth/login/', { email, password })
    saveAuth(data)
  }

  async function register(payload) {
    await api.post('/api/auth/register/', payload)
  }

  function logout() {
    localStorage.removeItem('auth')
    setUser(null)
    setAccess(null)
    setRefresh(null)
  }

  const value = { user, access, refresh, login, register, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
