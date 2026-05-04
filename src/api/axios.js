import axios from 'axios'
import { API_ENDPOINTS } from './endpoints'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
export const AUTH_INVALIDATED_EVENT = 'aulaaldia:auth-invalidated'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30 segundos - suficiente para envío de email
})

let memoryTenantId = null

function getTokens() {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

function setTokens(tokens) {
  const raw = localStorage.getItem('auth')
  const current = raw ? JSON.parse(raw) : {}
  const next = { ...current, ...tokens }
  localStorage.setItem('auth', JSON.stringify(next))
}

function notifyAuthInvalidated() {
  if (typeof window === 'undefined') return

  window.dispatchEvent(new CustomEvent(AUTH_INVALIDATED_EVENT))
}

function attachUserMessage(error) {
  if (!error || typeof error !== 'object') {
    return error
  }

  if (!error.userMessage) {
    error.userMessage = getApiErrorMessage(error, {
      action: 'completar esta accion',
    })
  }

  return error
}

function getActiveTenantId() {
  const auth = getTokens()
  if (auth?.active_tenant_id) return auth.active_tenant_id
  if (auth?.user?.active_tenant_id) return auth.user.active_tenant_id
  if (auth?.user?.active_tenant?.public_id) return auth.user.active_tenant.public_id
  return memoryTenantId || null
}

export function setApiActiveTenantId(tenantId) {
  memoryTenantId = tenantId || null

  const raw = localStorage.getItem('auth')
  if (!raw) return

  const current = JSON.parse(raw)
  const next = { ...current, active_tenant_id: memoryTenantId }
  localStorage.setItem('auth', JSON.stringify(next))
}

api.interceptors.request.use((config) => {
  const auth = getTokens()
  config.headers = config.headers || {}

  const activeTenantId = getActiveTenantId()
  if (activeTenantId) {
    config.headers['X-Tenant-ID'] = activeTenantId
  } else {
    delete config.headers['X-Tenant-ID']
  }

  if (auth?.access) {
    config.headers['Authorization'] = `Bearer ${auth.access}`
  }

  return config
})

let isRefreshing = false
let pending = []

function onRefreshed(token) {
  pending.forEach((cb) => cb(token))
  pending = []
}

api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const auth = getTokens()
      if (!auth?.refresh) {
        return Promise.reject(attachUserMessage(error))
      }
      if (isRefreshing) {
        return new Promise((resolve) => {
          pending.push((token) => {
            original.headers['Authorization'] = 'Bearer ' + token
            resolve(api(original))
          })
        })
      }
      isRefreshing = true
      try {
        const { data } = await axios.post(`${API_BASE}${API_ENDPOINTS.auth.tokenRefresh}`, {
          refresh: auth.refresh,
        })
        setTokens({
          access: data.access,
          active_tenant_id: data.active_tenant_id ?? getActiveTenantId(),
        })
        isRefreshing = false
        onRefreshed(data.access)
        original.headers['Authorization'] = 'Bearer ' + data.access
        return api(original)
      } catch (e) {
        isRefreshing = false
        localStorage.removeItem('auth')
        notifyAuthInvalidated()
        return Promise.reject(attachUserMessage(e))
      }
    }
    return Promise.reject(attachUserMessage(error))
  }
)
