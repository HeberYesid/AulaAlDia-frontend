import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Dashboard from '../Dashboard'
import * as AuthContext from '../../state/AuthContext'
import { api } from '../../api/axios'
import * as attendanceHook from '../../hooks/useTeacherAttendance'

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

vi.mock('../../hooks/useTeacherAttendance', () => ({
  fetchTeacherAttendanceCurrent: vi.fn(),
  checkInTeacherAttendance: vi.fn(),
  checkOutTeacherAttendance: vi.fn(),
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
    attendanceHook.fetchTeacherAttendanceCurrent.mockResolvedValue({ has_open_shift: false, shift: null })
    attendanceHook.checkInTeacherAttendance.mockResolvedValue({ result: 'created' })
    attendanceHook.checkOutTeacherAttendance.mockResolvedValue({ result: 'closed' })
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

  it('redirects ADMIN users to /admin/dashboard after loading guard resolves', async () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: {
        id: 7,
        email: 'admin@example.com',
        first_name: 'Admin',
        last_name: 'User',
        role: 'ADMIN',
      },
      activeTenantId: 'tenant-1',
      tenantsLoaded: true,
      tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio Central' }],
      switchTenant: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/admin/dashboard" element={<div>Admin Dashboard Target</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Admin Dashboard Target')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByLabelText(/cargando dashboard/i)).not.toBeInTheDocument()
    })
  })

  it('shows teacher attendance card and can check in', async () => {
    api.get.mockResolvedValue({ data: [] })
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockTeacherUser,
      loading: false,
      activeTenantId: 'tenant-1',
      tenantsLoaded: true,
      tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio Central' }],
      switchTenant: vi.fn(),
    })

    renderDashboard()

    expect(await screen.findByRole('heading', { name: /asistencia docente/i })).toBeInTheDocument()

    const checkInButton = await screen.findByRole('button', { name: /marcar entrada/i })
    checkInButton.click()

    await waitFor(() => {
      expect(attendanceHook.checkInTeacherAttendance).toHaveBeenCalledTimes(1)
    })
  })
})
