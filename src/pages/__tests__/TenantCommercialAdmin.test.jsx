import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TenantCommercialAdmin from '../TenantCommercialAdmin'
import { useAuth } from '../../state/AuthContext'
import { api } from '../../api/axios'

vi.mock('../../state/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../api/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
  AUTH_INVALIDATED_EVENT: 'aulaaldia:auth-invalidated',
  setApiActiveTenantId: vi.fn(),
}))

describe('TenantCommercialAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks access for non-global-admin users', () => {
    useAuth.mockReturnValue({
      user: { role: 'ADMIN', is_global_admin: false },
      tenants: [],
      activeTenantId: null,
    })

    render(<TenantCommercialAdmin />)

    expect(screen.getByText(/acceso restringido/i)).toBeInTheDocument()
  })

  it('loads tenant commercial config and audits', async () => {
    const user = userEvent.setup()
    useAuth.mockReturnValue({
      user: { role: 'ADMIN', is_global_admin: true },
      tenants: [
        {
          tenant_id: '11111111-1111-1111-1111-111111111111',
          tenant_name: 'Colegio Norte',
          tenant_slug: 'colegio-norte',
        },
      ],
      activeTenantId: null,
    })

    api.get
      .mockResolvedValueOnce({
        data: {
          name: 'Colegio Norte',
          slug: 'colegio-norte',
          plan: 'SCHOOL',
          max_subjects: 80,
          max_students: 2000,
          max_teachers: 120,
          max_members: 2300,
        },
      })
      .mockResolvedValueOnce({
        data: {
          results: [],
          offset: 0,
          total_count: 0,
        },
      })

    render(<TenantCommercialAdmin />)

    await user.selectOptions(
      screen.getByLabelText(/desde mis instituciones/i),
      '11111111-1111-1111-1111-111111111111'
    )
    await user.click(screen.getByRole('button', { name: /cargar configuraci.n comercial/i }))

    expect(await screen.findByText(/configuraci.n comercial cargada/i)).toBeInTheDocument()
    expect(screen.getByText(/tenant cargado:/i)).toBeInTheDocument()
    expect(api.get).toHaveBeenNthCalledWith(
      1,
      '/api/v1/auth/tenants/11111111-1111-1111-1111-111111111111/commercial/'
    )
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      '/api/v1/auth/tenants/11111111-1111-1111-1111-111111111111/commercial-audits/',
      expect.any(Object)
    )
  })

  it('saves commercial config with audit reason', async () => {
    const user = userEvent.setup()
    useAuth.mockReturnValue({
      user: { role: 'ADMIN', is_global_admin: true },
      tenants: [
        {
          tenant_id: '22222222-2222-2222-2222-222222222222',
          tenant_name: 'Instituto Sur',
          tenant_slug: 'instituto-sur',
        },
      ],
      activeTenantId: '22222222-2222-2222-2222-222222222222',
    })

    api.patch.mockResolvedValue({
      data: {
        message: 'Configuracion comercial actualizada.',
        tenant: {
          name: 'Instituto Sur',
          slug: 'instituto-sur',
          plan: 'ENTERPRISE',
          max_subjects: null,
          max_students: null,
          max_teachers: null,
          max_members: null,
        },
      },
    })
    api.get.mockResolvedValue({
      data: {
        results: [],
        offset: 0,
        total_count: 0,
      },
    })

    render(<TenantCommercialAdmin />)

    await user.selectOptions(screen.getByLabelText(/^Plan$/i), 'ENTERPRISE')
    await user.type(
      screen.getByLabelText(/motivo del cambio/i),
      'Ajuste comercial aprobado para piloto institucional'
    )

    await user.click(screen.getByRole('button', { name: /guardar configuraci.n comercial/i }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/api/v1/auth/tenants/22222222-2222-2222-2222-222222222222/commercial/',
        expect.objectContaining({
          plan: 'ENTERPRISE',
          reason: 'Ajuste comercial aprobado para piloto institucional',
        })
      )
    })

    expect(await screen.findByText(/configuraci.n comercial actualizada/i)).toBeInTheDocument()
  })
})
