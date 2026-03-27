import { api } from './axios'

export async function listTenantUsers(filters = {}) {
  const params = {}
  const search = typeof filters.search === 'string' ? filters.search.trim() : ''
  const role = typeof filters.role === 'string' ? filters.role.trim().toUpperCase() : ''
  const status = typeof filters.status === 'string' ? filters.status.trim().toLowerCase() : ''

  if (search) {
    params.search = search
  }
  if (role && role !== 'ALL') {
    params.role = role
  }
  if (status && status !== 'all') {
    params.status = status
  }

  const { data } = await api.get('/api/v1/auth/tenant-users/', { params })
  return Array.isArray(data) ? data : []
}

export async function createTenantUser(payload) {
  const { data } = await api.post('/api/v1/auth/tenant-users/', payload)
  return data
}

export async function updateTenantUserStatus(userId, isActive) {
  const { data } = await api.patch(`/api/v1/auth/tenant-users/${userId}/`, {
    is_active: Boolean(isActive),
  })
  return data
}

export async function deleteTenantUser(userId) {
  await api.delete(`/api/v1/auth/tenant-users/${userId}/`)
}
