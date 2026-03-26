import { api } from './axios'

export async function listTenantUsers() {
  const { data } = await api.get('/api/v1/auth/tenant-users/')
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
