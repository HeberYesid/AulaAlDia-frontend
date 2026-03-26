import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../Dashboard'
import * as AuthContext from '../../state/AuthContext'
import { api } from '../../api/axios'

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  AUTH_INVALIDATED_EVENT: 'aulaaldia:auth-invalidated',
  setApiActiveTenantId: vi.fn(),
}))

const mockTeacherUser = {
  id: 2,
  email: 'teacher@example.com',
  first_name: 'Teacher',
  last_name: 'User',
  role: 'TEACHER',
}

describe('Dashboard Component', () => {
  const renderDashboard = () => render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard for authenticated user', async () => {
    api.get.mockResolvedValue({ data: [] })
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockTeacherUser,
      loading: false
    })
    
    renderDashboard()
    
    expect(await screen.findByText(/mis materias/i)).toBeInTheDocument()
  })

  it('shows user name in welcome message', async () => {
    api.get.mockResolvedValue({ data: [] })
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockTeacherUser,
      loading: false
    })
    
    renderDashboard()
    
    expect(await screen.findByRole('heading', { name: /bienvenido/i })).toBeInTheDocument()
    expect(screen.getByText(/teacher/i)).toBeInTheDocument()
  })

  it('displays loading state', async () => {
    let resolveRequest
    api.get.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve
        })
    )

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockTeacherUser,
      loading: false
    })
    
    renderDashboard()
    
    expect(screen.getByLabelText(/cargando dashboard/i)).toBeInTheDocument()

    resolveRequest({ data: [] })

    await waitFor(() => {
      expect(screen.queryByLabelText(/cargando dashboard/i)).not.toBeInTheDocument()
    })
  })

  it('shows tenant selection prompt and skips subjects request when active tenant is missing', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockTeacherUser,
      activeTenantId: null,
      tenantsLoaded: true,
      tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio Central' }],
      switchTenant: vi.fn(),
    })

    renderDashboard()

    expect(await screen.findByText(/select institution/i)).toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalled()
  })

  it('shows access denied state when active tenant is not authorized', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockTeacherUser,
      activeTenantId: 'tenant-b',
      tenantsLoaded: true,
      tenants: [{ tenant_id: 'tenant-a', tenant_name: 'Colegio A' }],
      switchTenant: vi.fn(),
    })

    renderDashboard()

    expect(await screen.findByText(/access denied/i)).toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalled()
  })
})
