import { api } from './axios'
import { unwrapListData } from '../utils/pagination'

export async function listSupportTickets(filters = {}) {
  const params = {}
  const status = typeof filters.status === 'string' ? filters.status.trim().toUpperCase() : ''
  const search = typeof filters.search === 'string' ? filters.search.trim() : ''

  if (status && status !== 'ALL') {
    params.status = status
  }

  if (search) {
    params.search = search
  }

  const { data } = await api.get('/api/v1/auth/tenant-support-tickets/', { params })
  return unwrapListData(data)
}

export async function createSupportTicket(payload) {
  const { data } = await api.post('/api/v1/auth/tenant-support-tickets/', payload)
  return data
}
