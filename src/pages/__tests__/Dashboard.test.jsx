import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    attendanceHook.fetchTeacherAttendanceCurrent.mockResolvedValue({
      has_open_shift: false,
      shift: null,
      has_marked_today: false,
      today_shift: null,
    })
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

  it('shows teacher attendance card, opens confirmation dialog and can check in', async () => {
    const getDaySpy = vi.spyOn(Date.prototype, 'getDay').mockReturnValue(1)
    api.get.mockResolvedValue({ data: [] })
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockTeacherUser,
      loading: false,
      activeTenantId: 'tenant-1',
      tenantsLoaded: true,
      tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio Central' }],
      switchTenant: vi.fn(),
    })

    try {
      renderDashboard()

      expect(await screen.findByRole('heading', { name: /asistencia docente/i })).toBeInTheDocument()

      const user = userEvent.setup()
      const checkInButton = await screen.findByRole('button', { name: /marcar entrada/i })
      await user.click(checkInButton)

      expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText(/confirmar entrada docente/i)).toBeInTheDocument()

      const confirmButton = screen.getByRole('button', { name: /confirmar/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(attendanceHook.checkInTeacherAttendance).toHaveBeenCalledTimes(1)
      })
    } finally {
      getDaySpy.mockRestore()
    }
  })

  it('shows current day label in teacher attendance card', async () => {
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

    expect(await screen.findByText(/hoy:/i)).toBeInTheDocument()
  })

  it('hides attendance actions on non-working days', async () => {
    const getDaySpy = vi.spyOn(Date.prototype, 'getDay').mockReturnValue(0)
    api.get.mockResolvedValue({ data: [] })
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockTeacherUser,
      loading: false,
      activeTenantId: 'tenant-1',
      tenantsLoaded: true,
      tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio Central' }],
      switchTenant: vi.fn(),
    })

    try {
      renderDashboard()

      expect(await screen.findByText(/hoy no es un día laborable/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /marcar entrada/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /marcar salida/i })).not.toBeInTheDocument()
    } finally {
      getDaySpy.mockRestore()
    }
  })

  it('hides check-in button when teacher already marked attendance today', async () => {
    const getDaySpy = vi.spyOn(Date.prototype, 'getDay').mockReturnValue(1)
    attendanceHook.fetchTeacherAttendanceCurrent.mockResolvedValue({
      has_open_shift: false,
      shift: null,
      has_marked_today: true,
      today_shift: {
        id: 10,
        status: 'closed',
        check_out_at: '2026-04-06T17:00:00Z',
      },
    })
    api.get.mockResolvedValue({ data: [] })
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockTeacherUser,
      loading: false,
      activeTenantId: 'tenant-1',
      tenantsLoaded: true,
      tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio Central' }],
      switchTenant: vi.fn(),
    })

    try {
      renderDashboard()

      expect(await screen.findByText(/ya registraste entrada y salida hoy/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /marcar entrada/i })).not.toBeInTheDocument()
    } finally {
      getDaySpy.mockRestore()
    }
  })

  it('shows check-out button when there is an open shift for today and confirms before closing', async () => {
    const getDaySpy = vi.spyOn(Date.prototype, 'getDay').mockReturnValue(1)
    attendanceHook.fetchTeacherAttendanceCurrent.mockResolvedValue({
      has_open_shift: true,
      shift: {
        id: 11,
        status: 'open',
        check_out_at: null,
      },
      has_marked_today: true,
      today_shift: {
        id: 11,
        status: 'open',
        check_out_at: null,
      },
    })
    api.get.mockResolvedValue({ data: [] })
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockTeacherUser,
      loading: false,
      activeTenantId: 'tenant-1',
      tenantsLoaded: true,
      tenants: [{ tenant_id: 'tenant-1', tenant_name: 'Colegio Central' }],
      switchTenant: vi.fn(),
    })

    try {
      renderDashboard()

      const user = userEvent.setup()
      const checkOutButton = await screen.findByRole('button', { name: /marcar salida/i })
      await user.click(checkOutButton)

      expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText(/confirmar salida docente/i)).toBeInTheDocument()

      const confirmButton = screen.getByRole('button', { name: /confirmar/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(attendanceHook.checkOutTeacherAttendance).toHaveBeenCalledTimes(1)
      })
    } finally {
      getDaySpy.mockRestore()
    }
  })
})
