import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30 segundos - suficiente para envío de email
})

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

api.interceptors.request.use((config) => {
  const auth = getTokens()
  if (auth?.access) {
    config.headers = config.headers || {}
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
        return Promise.reject(error)
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
        const { data } = await axios.post(`${API_BASE}/api/v1/auth/token/refresh/`, {
          refresh: auth.refresh,
        })
        setTokens({ access: data.access })
        isRefreshing = false
        onRefreshed(data.access)
        original.headers['Authorization'] = 'Bearer ' + data.access
        return api(original)
      } catch (e) {
        isRefreshing = false
        localStorage.removeItem('auth')
        return Promise.reject(e)
      }
    }
    return Promise.reject(error)
  }
)
